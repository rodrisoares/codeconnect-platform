import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Gera access_token (curto) e refresh_token (longo)
  private async generateTokens(sub: string, email: string) {
    const payload = { sub, email };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.refreshSecret,
        expiresIn: jwtConstants.refreshExpiresIn,
      }),
    ]);
    return { access_token, refresh_token };
  }

  async register(registerDto: RegisterDto) {
    // Verifica se o usuário já existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Cria o usuário
    const user = await this.usersService.create(registerDto);

    // Remove a senha da resposta
    const { password, ...result } = user;

    // Gera os tokens JWT
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: result,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Remove a senha da resposta
    const { password, ...result } = user;

    // Gera os tokens JWT
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: result,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(refreshToken, { secret: jwtConstants.refreshSecret });

      const access_token = await this.jwtService.signAsync(
        { sub: payload.sub, email: payload.email },
        { secret: jwtConstants.secret, expiresIn: jwtConstants.accessExpiresIn },
      );

      return { access_token };
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Remove a senha da resposta
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(
      userId,
      updateProfileDto,
    );

    // Remove a senha da resposta
    const { password, ...result } = user;
    return result;
  }
}
