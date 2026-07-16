import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CommentsService } from './comments.service';

const createPrismaMock = () => ({
  post: { findUnique: jest.fn() },
  comment: {
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  commentLike: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: { findMany: jest.fn() },
});

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let notifications: { create: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    notifications = { create: jest.fn().mockResolvedValue(null) };
    service = new CommentsService(prisma as never, notifications as never);
  });

  describe('create', () => {
    it('cria comentário raiz e notifica o autor do post', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, authorId: 'author' });
      prisma.comment.create.mockResolvedValue({
        id: 10,
        text: 'ótimo post',
        author: { id: 'u2' },
      });
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.create(
        { text: 'ótimo post' } as never,
        1,
        'u2',
      );

      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'COMMENT', userId: 'author' }),
      );
      expect(result.likesCount).toBe(0);
      expect(result.likedByMe).toBe(false);
    });

    it('notifica os usuários mencionados (@username)', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, authorId: 'author' });
      prisma.comment.create.mockResolvedValue({ id: 11, author: { id: 'u2' } });
      prisma.user.findMany.mockResolvedValue([{ id: 'bob' }]);

      await service.create({ text: 'olá @bob' } as never, 1, 'u2');

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'MENTION', userId: 'bob' }),
      );
    });

    it('achata respostas em 1 nível e valida o pai', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 1, authorId: 'author' });
      // pai é uma resposta (parentId 5) -> ancora no comentário raiz 5
      prisma.comment.findUnique.mockResolvedValue({
        id: 20,
        postId: 1,
        parentId: 5,
        authorId: 'parentAuthor',
      });
      prisma.comment.create.mockResolvedValue({ id: 21, author: { id: 'u2' } });
      prisma.user.findMany.mockResolvedValue([]);

      await service.create({ text: 'resposta', parentId: 20 } as never, 1, 'u2');

      const createArg = prisma.comment.create.mock.calls[0][0];
      expect(createArg.data.parentId).toBe(5);
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'COMMENT', userId: 'parentAuthor' }),
      );
    });

    it('rejeita comentário em post inexistente', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ text: 'x' } as never, 999, 'u2'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('toggleLike', () => {
    it('curte o comentário e notifica o autor', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: 10,
        authorId: 'ca',
        postId: 5,
      });
      prisma.commentLike.findUnique.mockResolvedValue(null);
      prisma.commentLike.count.mockResolvedValue(1);

      const result = await service.toggleLike(10, 'u2');

      expect(prisma.commentLike.create).toHaveBeenCalled();
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'COMMENT_LIKE', userId: 'ca' }),
      );
      expect(result).toEqual({ likes: 1, likedByMe: true });
    });

    it('descurte quando já havia curtido', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 10, authorId: 'ca' });
      prisma.commentLike.findUnique.mockResolvedValue({ id: 3 });
      prisma.commentLike.count.mockResolvedValue(0);

      const result = await service.toggleLike(10, 'u2');

      expect(prisma.commentLike.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
      expect(result).toEqual({ likes: 0, likedByMe: false });
    });
  });

  describe('update', () => {
    it('impede editar comentário de outro autor', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 10, authorId: 'u1' });
      await expect(
        service.update(10, { text: 'novo' } as never, 'u2'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
