import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';

// Mock mínimo do Prisma com os métodos usados pelo PostsService
const createPrismaMock = () => ({
  post: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  like: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  bookmark: { findMany: jest.fn() },
  comment: { deleteMany: jest.fn() },
  $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
});

describe('PostsService', () => {
  let service: PostsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let notifications: { create: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    notifications = { create: jest.fn().mockResolvedValue(null) };
    service = new PostsService(prisma as never, notifications as never);
  });

  describe('create', () => {
    it('gera slug único, serializa tags e inicia likes em 0', async () => {
      prisma.post.findUnique.mockResolvedValue(null); // slug disponível
      prisma.post.create.mockResolvedValue({
        id: 1,
        title: 'Meu Post',
        slug: 'meu-post',
        tags: '["React"]',
        author: { id: 'u1', name: 'Ana' },
      });

      const result = await service.create(
        { title: 'Meu Post', body: 'corpo', cover: 'http://x/y.png' } as never,
        'u1',
      );

      expect(prisma.post.create).toHaveBeenCalled();
      expect(result.tags).toEqual(['React']);
      expect(result.likes).toBe(0);
      expect(result.likedByMe).toBe(false);
      expect(result.commentsCount).toBe(0);
    });
  });

  describe('toggleLike', () => {
    it('curte quando ainda não curtiu e notifica o autor', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, authorId: 'autor' });
      prisma.like.findUnique.mockResolvedValue(null);
      prisma.like.create.mockResolvedValue({ id: 9 });
      prisma.like.count.mockResolvedValue(1);

      const result = await service.toggleLike(1, 'u2');

      expect(prisma.like.create).toHaveBeenCalled();
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LIKE', userId: 'autor', actorId: 'u2' }),
      );
      expect(result).toEqual({ likes: 1, likedByMe: true });
    });

    it('descurte quando já havia curtido (sem notificar)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, authorId: 'autor' });
      prisma.like.findUnique.mockResolvedValue({ id: 9 });
      prisma.like.count.mockResolvedValue(0);

      const result = await service.toggleLike(1, 'u2');

      expect(prisma.like.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(notifications.create).not.toHaveBeenCalled();
      expect(result).toEqual({ likes: 0, likedByMe: false });
    });

    it('lança NotFound quando o post não existe', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.toggleLike(999, 'u2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('impede editar post de outro autor', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, authorId: 'dono' });
      await expect(
        service.update(1, { title: 'x' } as never, 'intruso'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lança NotFound quando o post não existe', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(
        service.update(1, { title: 'x' } as never, 'u1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('impede excluir post de outro autor', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, authorId: 'dono' });
      await expect(service.remove(1, 'intruso')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('exclui o post do próprio autor', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, authorId: 'u1' });
      const result = await service.remove(1, 'u1');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, deleted: true });
    });
  });
});
