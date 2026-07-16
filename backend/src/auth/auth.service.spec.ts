import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    validatePassword: jest.Mock;
    findById: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  const fakeUser = {
    id: 'u1',
    email: 'ana@example.com',
    name: 'Ana',
    password: 'hashed',
    username: 'ana',
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      validatePassword: jest.fn(),
      findById: jest.fn(),
    };
    jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    service = new AuthService(usersService as never, jwtService as never);
  });

  describe('register', () => {
    it('rejeita e-mail já em uso', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);
      await expect(
        service.register({ name: 'Ana', email: fakeUser.email, password: '123' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('cria o usuário, retorna tokens e omite a senha', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(fakeUser);
      jwtService.signAsync
        .mockResolvedValueOnce('access')
        .mockResolvedValueOnce('refresh');

      const result = await service.register({
        name: 'Ana',
        email: fakeUser.email,
        password: '123',
      });

      expect(result.access_token).toBe('access');
      expect(result.refresh_token).toBe('refresh');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(fakeUser.email);
    });
  });

  describe('login', () => {
    it('rejeita usuário inexistente', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@x.com', password: '123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita senha inválida', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);
      usersService.validatePassword.mockResolvedValue(false);
      await expect(
        service.login({ email: fakeUser.email, password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('autentica com credenciais válidas', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser);
      usersService.validatePassword.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access')
        .mockResolvedValueOnce('refresh');

      const result = await service.login({
        email: fakeUser.email,
        password: '123',
      });

      expect(result.access_token).toBe('access');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('refresh', () => {
    it('gera novo access token a partir de um refresh válido', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', email: 'a@a.com' });
      jwtService.signAsync.mockResolvedValue('novo-access');

      const result = await service.refresh('refresh-valido');
      expect(result.access_token).toBe('novo-access');
    });

    it('rejeita refresh inválido/expirado', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      await expect(service.refresh('invalido')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
