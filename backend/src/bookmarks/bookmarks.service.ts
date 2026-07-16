import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const authorSelect = {
  select: {
    id: true,
    name: true,
    username: true,
    avatar: true,
  },
};

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  // Converte o campo tags (JSON string) de volta para array
  private formatPost<T extends { tags: string }>(post: T) {
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

  // Alterna o bookmark do usuário (salva/remove)
  async toggle(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await this.prisma.bookmark.create({ data: { userId, postId } });
    return { bookmarked: true };
  }

  // Lista os posts salvos pelo usuário (ordem: salvos mais recentes primeiro)
  async findAllForUser(userId: string) {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId },
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

    // Marca todos como bookmarkedByMe (vieram justamente dos bookmarks) e
    // resolve likedByMe em uma única consulta.
    const postIds = rows.map((r) => r.postId);
    const likes = postIds.length
      ? await this.prisma.like.findMany({
          where: { userId, postId: { in: postIds } },
          select: { postId: true },
        })
      : [];
    const likedSet = new Set(likes.map((l) => l.postId));

    return rows.map((row) => {
      const { _count, ...post } = row.post;
      return {
        ...this.formatPost(post),
        likes: _count.likedBy,
        commentsCount: _count.comments,
        likedByMe: likedSet.has(post.id),
        bookmarkedByMe: true,
      };
    });
  }
}
