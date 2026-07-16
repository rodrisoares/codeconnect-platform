import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const actorSelect = {
  select: {
    id: true,
    name: true,
    username: true,
    avatar: true,
  },
};

export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'FOLLOW'
  | 'COMMENT_LIKE'
  | 'MENTION';

interface CreateNotificationParams {
  // Destinatário
  userId: string;
  // Quem gerou a ação
  actorId: string;
  type: NotificationType;
  postId?: number;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Cria uma notificação. Ignora quando o ator é o próprio destinatário
  // (ninguém precisa ser notificado das próprias ações).
  async create({ userId, actorId, type, postId }: CreateNotificationParams) {
    if (userId === actorId) return null;
    try {
      return await this.prisma.notification.create({
        data: { userId, actorId, type, postId },
      });
    } catch {
      // Notificação é um efeito colateral: nunca deve quebrar a ação principal
      return null;
    }
  }

  async findAllForUser(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      include: {
        actor: actorSelect,
        post: { select: { id: true, slug: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }

  async markRead(id: number, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    return { success: true };
  }
}
