import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { NotificationsService } from '../notifications/notifications.service';

const authorSelect = {
  select: {
    id: true,
    name: true,
    username: true,
    avatar: true,
  },
};

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Converte o campo tags (armazenado como JSON string) de volta para array
  private formatPost<T extends { tags: string } | null>(post: T) {
    if (!post) return post;
    let tags: string[] = [];
    try {
      const parsed: unknown = JSON.parse(post.tags);
      if (Array.isArray(parsed)) {
        tags = parsed.filter((t): t is string => typeof t === 'string');
      }
    } catch {
      tags = [];
    }
    return { ...post, tags };
  }

  // Normaliza uma linha de post que inclui _count (likedBy/comments),
  // derivando o contador de curtidas da relação (fonte única de verdade).
  private formatRow<
    T extends { tags: string; _count: { likedBy: number; comments?: number } },
  >(post: T) {
    const { _count, ...rest } = post;
    return {
      ...this.formatPost(rest),
      likes: _count.likedBy,
      commentsCount: _count.comments ?? 0,
    };
  }

  // Marca cada post com likedByMe e bookmarkedByMe (relativos ao usuário logado)
  private async attachUserFlags<T extends { id: number }>(
    posts: T[],
    userId?: string,
  ): Promise<Array<T & { likedByMe: boolean; bookmarkedByMe: boolean }>> {
    if (!userId || posts.length === 0) {
      return posts.map((p) => ({
        ...p,
        likedByMe: false,
        bookmarkedByMe: false,
      }));
    }
    const ids = posts.map((p) => p.id);
    const [likes, bookmarks] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId, postId: { in: ids } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId, postId: { in: ids } },
        select: { postId: true },
      }),
    ]);
    const liked = new Set(likes.map((l) => l.postId));
    const bookmarked = new Set(bookmarks.map((b) => b.postId));
    return posts.map((p) => ({
      ...p,
      likedByMe: liked.has(p.id),
      bookmarkedByMe: bookmarked.has(p.id),
    }));
  }

  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async generateUniqueSlug(base: string): Promise<string> {
    const root = this.slugify(base) || 'post';
    let slug = root;
    let counter = 2;
    while (await this.prisma.post.findUnique({ where: { slug } })) {
      slug = `${root}-${counter}`;
      counter += 1;
    }
    return slug;
  }

  async create(createPostDto: CreatePostDto, authorId: string) {
    const { tags, slug, markdown, title, status, ...rest } = createPostDto;

    const finalSlug = slug
      ? await this.generateUniqueSlug(slug)
      : await this.generateUniqueSlug(title);

    const post = await this.prisma.post.create({
      data: {
        ...rest,
        title,
        slug: finalSlug,
        markdown: markdown ?? createPostDto.body,
        tags: JSON.stringify(tags ?? []),
        status: status ?? 'PUBLISHED',
        authorId,
      },
      include: {
        author: authorSelect,
      },
    });

    return {
      ...this.formatPost(post),
      likes: 0,
      likedByMe: false,
      bookmarkedByMe: false,
      commentsCount: 0,
    };
  }

  async findAll(query: QueryPostsDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = { status: 'PUBLISHED' };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { body: { contains: query.search } },
      ];
    }

    if (query.tag) {
      // tags é uma JSON string (ex.: ["React"]) — busca pelo valor entre aspas
      where.tags = { contains: JSON.stringify(query.tag) };
    }

    // Feed "Seguindo": restringe aos autores que o usuário logado segue.
    // Sem usuário logado, "following" não faz sentido e retorna vazio.
    if (query.filter === 'following') {
      if (!userId) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0, hasMore: false },
        };
      }
      const follows = await this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      where.authorId = { in: follows.map((f) => f.followingId) };
    }

    // Ordenação: mais populares (por nº de curtidas) ou mais recentes (padrão)
    const orderBy: Prisma.PostOrderByWithRelationInput[] =
      query.sort === 'popular'
        ? [{ likedBy: { _count: 'desc' } }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        include: {
          author: authorSelect,
          _count: { select: { comments: true, likedBy: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const formatted = rows.map((post) => this.formatRow(post));

    const data = await this.attachUserFlags(formatted, userId);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + rows.length < total,
      },
    };
  }

  // Lista as tags distintas dos posts publicados com a contagem de uso,
  // ordenadas por popularidade (mais usadas primeiro). Usado para os filtros
  // e para a seção "Tags em alta".
  async getTags(): Promise<Array<{ tag: string; count: number }>> {
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { tags: true },
    });
    const counts = new Map<string, number>();
    posts.forEach((p) => {
      try {
        const parsed: unknown = JSON.parse(p.tags);
        if (Array.isArray(parsed)) {
          parsed.forEach((t) => {
            if (typeof t === 'string') {
              counts.set(t, (counts.get(t) ?? 0) + 1);
            }
          });
        }
      } catch {
        // ignora tags inválidas
      }
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }

  // Lista os posts publicados que o usuário curtiu (aba "Curtidos" do perfil)
  async findLikedByUser(userId: string) {
    const likes = await this.prisma.like.findMany({
      where: { userId, post: { status: 'PUBLISHED' } },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: authorSelect,
            _count: { select: { comments: true, likedBy: true } },
          },
        },
      },
    });

    const formatted = likes.map((like) => this.formatRow(like.post));

    return this.attachUserFlags(formatted, userId);
  }

  async findByAuthor(authorIdOrUsername: string, viewerId?: string) {
    // Aceita id (cuid) ou username, para funcionar com links de @menção
    const author = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: authorIdOrUsername }, { username: authorIdOrUsername }],
      },
      select: { id: true },
    });
    if (!author) return [];
    const authorId = author.id;

    // O próprio autor vê seus rascunhos; visitantes só veem publicados
    const where: Prisma.PostWhereInput = { authorId };
    if (viewerId !== authorId) {
      where.status = 'PUBLISHED';
    }

    const rows = await this.prisma.post.findMany({
      where,
      include: {
        author: authorSelect,
        _count: { select: { comments: true, likedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = rows.map((post) => this.formatRow(post));

    return this.attachUserFlags(formatted, viewerId);
  }

  // Include para o post individual: contadores de curtidas e comentários.
  // Os comentários em si são carregados sob demanda pelo endpoint /comments
  // (paginados), não mais embutidos no post.
  private readonly singlePostInclude = {
    author: authorSelect,
    _count: { select: { likedBy: true, comments: true } },
  };

  private formatSinglePost<
    T extends { tags: string; _count: { likedBy: number; comments: number } },
  >(post: T) {
    const { _count, ...rest } = post;
    return {
      ...this.formatPost(rest),
      likes: _count.likedBy,
      commentsCount: _count.comments,
    };
  }

  async findOne(id: number, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.singlePostInclude,
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    const [withLike] = await this.attachUserFlags(
      [this.formatSinglePost(post)],
      userId,
    );
    return withLike;
  }

  async findBySlug(slug: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: this.singlePostInclude,
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    const [withLike] = await this.attachUserFlags(
      [this.formatSinglePost(post)],
      userId,
    );
    return withLike;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: string) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new NotFoundException('Post não encontrado');
    }

    // Verificar se o usuário logado é o autor do post
    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('Você só pode editar seus próprios posts');
    }

    const { tags, ...rest } = updatePostDto;

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        ...rest,
        ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      },
      include: {
        author: authorSelect,
      },
    });

    return this.formatPost(post);
  }

  async remove(id: number, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    // Verificar se o usuário logado é o autor do post
    if (post.authorId !== userId) {
      throw new ForbiddenException('Você só pode deletar seus próprios posts');
    }

    // Remove dependências (comentários) antes do post. As curtidas são
    // removidas automaticamente via ON DELETE CASCADE.
    await this.prisma.$transaction([
      this.prisma.comment.deleteMany({ where: { postId: id } }),
      this.prisma.post.delete({ where: { id } }),
    ]);

    return { id, deleted: true };
  }

  // Alterna a curtida do usuário (like/unlike). O contador é sempre derivado
  // da tabela Like (count), então não há coluna denormalizada para divergir.
  async toggleLike(id: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId: id } },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      const likes = await this.prisma.like.count({ where: { postId: id } });
      return { likes, likedByMe: false };
    }

    await this.prisma.like.create({ data: { userId, postId: id } });
    const likes = await this.prisma.like.count({ where: { postId: id } });

    // Notifica o autor do post sobre a nova curtida (efeito colateral,
    // nunca bloqueia a resposta).
    await this.notifications.create({
      userId: post.authorId,
      actorId: userId,
      type: 'LIKE',
      postId: id,
    });

    return { likes, likedByMe: true };
  }
}
