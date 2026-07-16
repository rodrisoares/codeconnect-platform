import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

const authorSelect = {
  select: {
    id: true,
    name: true,
    username: true,
    avatar: true,
  },
};

// Captura menções no formato @username (letras, números, ponto, underline)
const MENTION_REGEX = /@([a-zA-Z0-9_.]+)/g;

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Anota o comentário (e suas respostas) com likesCount e likedByMe
  private formatComment(
    comment: {
      id: number;
      _count?: { likedBy: number };
      replies?: unknown[];
    } & Record<string, unknown>,
    likedSet: Set<number>,
  ): Record<string, unknown> {
    const { _count, replies, ...rest } = comment;
    return {
      ...rest,
      likesCount: _count?.likedBy ?? 0,
      likedByMe: likedSet.has(comment.id),
      ...(Array.isArray(replies)
        ? {
            replies: replies.map((r) =>
              this.formatComment(
                r as Parameters<typeof this.formatComment>[0],
                likedSet,
              ),
            ),
          }
        : {}),
    };
  }

  private async likedSetFor(
    userId: string | undefined,
    commentIds: number[],
  ): Promise<Set<number>> {
    if (!userId || commentIds.length === 0) return new Set();
    const rows = await this.prisma.commentLike.findMany({
      where: { userId, commentId: { in: commentIds } },
      select: { commentId: true },
    });
    return new Set(rows.map((r) => r.commentId));
  }

  // Notifica os usuários mencionados (@username) no texto
  private async notifyMentions(
    text: string,
    actorId: string,
    postId: number,
    excludeUserId?: string,
  ) {
    const usernames = [
      ...new Set(
        (text.match(MENTION_REGEX) ?? []).map((m) => m.slice(1)),
      ),
    ];
    if (usernames.length === 0) return;

    const users = await this.prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { id: true },
    });

    for (const u of users) {
      if (u.id === excludeUserId) continue; // já notificado via COMMENT
      await this.notifications.create({
        userId: u.id,
        actorId,
        type: 'MENTION',
        postId,
      });
    }
  }

  async create(
    createCommentDto: CreateCommentDto,
    postId: number,
    userId: string,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new BadRequestException('Post não encontrado');
    }

    // Destinatário da notificação principal: por padrão o autor do post.
    let notifyUserId = post.authorId;
    // Comentário-pai efetivo (achatamos threads em 1 nível).
    let parentId: number | null = null;

    if (createCommentDto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('Comentário pai inválido');
      }
      parentId = parent.parentId ?? parent.id;
      notifyUserId = parent.authorId;
    }

    const comment = await this.prisma.comment.create({
      data: {
        text: createCommentDto.text,
        postId,
        authorId: userId,
        parentId,
      },
      include: { author: authorSelect },
    });

    await this.notifications.create({
      userId: notifyUserId,
      actorId: userId,
      type: 'COMMENT',
      postId,
    });

    // Notifica os mencionados (menos quem já recebeu a notificação de comentário)
    await this.notifyMentions(
      createCommentDto.text,
      userId,
      postId,
      notifyUserId,
    );

    return { ...comment, likesCount: 0, likedByMe: false };
  }

  // Lista comentários raiz paginados, com respostas aninhadas e estado de like
  async findAllByPost(
    postId: number,
    userId?: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const [total, roots] = await this.prisma.$transaction([
      this.prisma.comment.count({ where: { postId, parentId: null } }),
      this.prisma.comment.findMany({
        where: { postId, parentId: null },
        include: {
          author: authorSelect,
          _count: { select: { likedBy: true } },
          replies: {
            include: {
              author: authorSelect,
              _count: { select: { likedBy: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const ids: number[] = [];
    roots.forEach((r) => {
      ids.push(r.id);
      r.replies.forEach((rp) => ids.push(rp.id));
    });
    const likedSet = await this.likedSetFor(userId, ids);

    return {
      data: roots.map((r) => this.formatComment(r, likedSet)),
      meta: {
        total,
        page,
        limit,
        hasMore: skip + roots.length < total,
      },
    };
  }

  // Alterna a curtida de um comentário
  async toggleLike(commentId: number, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await this.prisma.commentLike.delete({ where: { id: existing.id } });
      const likes = await this.prisma.commentLike.count({
        where: { commentId },
      });
      return { likes, likedByMe: false };
    }

    await this.prisma.commentLike.create({ data: { userId, commentId } });
    const likes = await this.prisma.commentLike.count({ where: { commentId } });

    await this.notifications.create({
      userId: comment.authorId,
      actorId: userId,
      type: 'COMMENT_LIKE',
      postId: comment.postId,
    });

    return { likes, likedByMe: true };
  }

  async findOne(id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: authorSelect },
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: string) {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (existingComment.authorId !== userId) {
      throw new ForbiddenException(
        'Você só pode editar seus próprios comentários',
      );
    }

    return this.prisma.comment.update({
      where: { id },
      data: { text: updateCommentDto.text },
      include: { author: authorSelect },
    });
  }

  async remove(id: number, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'Você só pode deletar seus próprios comentários',
      );
    }

    return this.prisma.comment.delete({ where: { id } });
  }
}
