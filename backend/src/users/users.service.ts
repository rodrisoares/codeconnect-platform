import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';

const publicUserSelect = {
  id: true,
  name: true,
  username: true,
  avatar: true,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const username = await this.generateUniqueUsername(
      this.usernameBase(registerDto.name, registerDto.email),
    );

    return this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        username,
      },
    });
  }

  // Deriva um "username base" a partir do nome (sem acentos, minúsculo, apenas
  // caracteres permitidos: letras, números, ponto e underline). Cai para o
  // trecho do e-mail e, por fim, "user".
  private usernameBase(name: string, email: string): string {
    const clean = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9_.]+/g, '');

    return clean(name) || clean(email.split('@')[0] ?? '') || 'user';
  }

  // Garante unicidade do username acrescentando um sufixo numérico se preciso.
  private async generateUniqueUsername(base: string): Promise<string> {
    let username = base;
    let counter = 2;
    while (
      await this.prisma.user.findUnique({ where: { username } })
    ) {
      username = `${base}${counter}`;
      counter += 1;
    }
    return username;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Garante que o novo username não pertença a outro usuário
    if (dto.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Nome de usuário já está em uso');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // ---- Perfil público e sistema de conexões (follow) ----

  // Resolve um parâmetro que pode ser id (cuid) ou username para o id real
  private async resolveUserId(idOrUsername: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: idOrUsername }, { username: idOrUsername }] },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user.id;
  }

  // Conquistas derivadas dos números do perfil (sem persistência)
  private computeBadges(stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    likesReceived: number;
    maxLikes: number;
  }) {
    const all = [
      {
        id: 'first_post',
        label: 'Primeiro post',
        emoji: '✍️',
        earned: stats.postsCount >= 1,
      },
      {
        id: 'prolific',
        label: 'Autor(a) prolífico(a)',
        emoji: '📚',
        earned: stats.postsCount >= 10,
      },
      {
        id: 'popular',
        label: 'Popular',
        emoji: '⭐',
        earned: stats.followersCount >= 10,
      },
      {
        id: 'connector',
        label: 'Conectado(a)',
        emoji: '🤝',
        earned: stats.followingCount >= 10,
      },
      {
        id: 'viral',
        label: 'Post viral',
        emoji: '🚀',
        earned: stats.maxLikes >= 100,
      },
      {
        id: 'beloved',
        label: 'Querido(a) pela comunidade',
        emoji: '❤️',
        earned: stats.likesReceived >= 100,
      },
    ];
    return all
      .filter((b) => b.earned)
      .map(({ id, label, emoji }) => ({ id, label, emoji }));
  }

  async getPublicProfile(idOrUsername: string, currentUserId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: idOrUsername }, { username: idOrUsername }] },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const id = user.id;

    const [
      followersCount,
      followingCount,
      postsCount,
      likesReceived,
      following,
      postLikeCounts,
    ] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: id } }),
      this.prisma.follow.count({ where: { followerId: id } }),
      this.prisma.post.count({ where: { authorId: id } }),
      // Total de curtidas recebidas = curtidas em todos os posts publicados
      this.prisma.like.count({
        where: { post: { authorId: id, status: 'PUBLISHED' } },
      }),
      currentUserId && currentUserId !== id
        ? this.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: id,
              },
            },
          })
        : Promise.resolve(null),
      this.prisma.post.findMany({
        where: { authorId: id, status: 'PUBLISHED' },
        select: { _count: { select: { likedBy: true } } },
      }),
    ]);

    const maxLikes = postLikeCounts.reduce(
      (max, p) => Math.max(max, p._count.likedBy),
      0,
    );

    return {
      ...user,
      followersCount,
      followingCount,
      postsCount,
      likesReceived,
      badges: this.computeBadges({
        postsCount,
        followersCount,
        followingCount,
        likesReceived,
        maxLikes,
      }),
      isFollowing: Boolean(following),
      isMe: currentUserId === id,
    };
  }

  // Atividade diária (posts + comentários) dos últimos 12 meses, para o heatmap
  async getActivity(idOrUsername: string) {
    const id = await this.resolveUserId(idOrUsername);

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 364);

    const [posts, comments] = await Promise.all([
      this.prisma.post.findMany({
        where: { authorId: id, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.comment.findMany({
        where: { authorId: id, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const counts = new Map<string, number>();
    const add = (d: Date) => {
      const key = d.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    };
    posts.forEach((p) => add(p.createdAt));
    comments.forEach((c) => add(c.createdAt));

    return {
      since: since.toISOString().slice(0, 10),
      days: Array.from(counts.entries()).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Você não pode seguir a si mesmo');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });

    // Notifica apenas quando é um follow novo (evita duplicar em re-follow)
    if (!existing) {
      await this.notifications.create({
        userId: followingId,
        actorId: followerId,
        type: 'FOLLOW',
      });
    }

    const followersCount = await this.prisma.follow.count({
      where: { followingId },
    });

    return { isFollowing: true, followersCount };
  }

  async unfollow(followerId: string, followingId: string) {
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });

    const followersCount = await this.prisma.follow.count({
      where: { followingId },
    });

    return { isFollowing: false, followersCount };
  }

  async getFollowers(idOrUsername: string) {
    const id = await this.resolveUserId(idOrUsername);
    const rows = await this.prisma.follow.findMany({
      where: { followingId: id },
      include: { follower: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.follower);
  }

  async getFollowing(idOrUsername: string) {
    const id = await this.resolveUserId(idOrUsername);
    const rows = await this.prisma.follow.findMany({
      where: { followerId: id },
      include: { following: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.following);
  }

  // Descoberta de pessoas: busca por nome/username ou, sem termo de busca,
  // sugere quem seguir (mais seguidos, excluindo o próprio usuário e quem
  // ele já segue).
  async discover(currentUserId?: string, search?: string) {
    const term = search?.trim();

    const where: Prisma.UserWhereInput = {};
    if (currentUserId) {
      where.id = { not: currentUserId };
    }

    if (term) {
      where.OR = [
        { name: { contains: term } },
        { username: { contains: term } },
      ];
    } else if (currentUserId) {
      // Sugestões: remove quem o usuário já segue
      const following = await this.prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      if (followingIds.length > 0) {
        where.id = { not: currentUserId, notIn: followingIds };
      }
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        ...publicUserSelect,
        bio: true,
        _count: { select: { followers: true } },
      },
      orderBy: { followers: { _count: 'desc' } },
      take: 20,
    });

    // Marca isFollowing relativo ao usuário logado
    let followingSet = new Set<string>();
    if (currentUserId && users.length > 0) {
      const rels = await this.prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: users.map((u) => u.id) },
        },
        select: { followingId: true },
      });
      followingSet = new Set(rels.map((r) => r.followingId));
    }

    return users.map((u) => {
      const { _count, ...rest } = u;
      return {
        ...rest,
        followersCount: _count.followers,
        isFollowing: followingSet.has(u.id),
      };
    });
  }
}
