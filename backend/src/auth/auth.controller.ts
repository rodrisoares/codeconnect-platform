import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import {
  authCookies,
  cookieBaseOptions,
  accessCookieMaxAge,
  refreshCookieMaxAge,
} from './constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshDto } from './dto/refresh.dto';
import {
  AuthResponseDto,
  UserResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Grava os tokens como cookies httpOnly
  private setAuthCookies(res: Response, access: string, refresh?: string) {
    res.cookie(authCookies.access, access, {
      ...cookieBaseOptions,
      maxAge: accessCookieMaxAge,
    });
    if (refresh) {
      res.cookie(authCookies.refresh, refresh, {
        ...cookieBaseOptions,
        maxAge: refreshCookieMaxAge,
      });
    }
    // Cookie-dica legível pelo JS (sem segredo): permite ao front saber que
    // existe sessão e evitar chamadas /auth/me quando o usuário está deslogado.
    res.cookie(authCookies.hint, '1', {
      ...cookieBaseOptions,
      httpOnly: false,
      maxAge: refreshCookieMaxAge,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(authCookies.access, cookieBaseOptions);
    res.clearCookie(authCookies.refresh, cookieBaseOptions);
    res.clearCookie(authCookies.hint, { ...cookieBaseOptions, httpOnly: false });
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email já está em uso ou dados inválidos',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return { user: result.user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Fazer login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return { user: result.user };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário retornados com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou não fornecido',
  })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados do perfil do usuário logado' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou nome de usuário já em uso',
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.sub, updateProfileDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Gerar novo access token a partir do refresh token' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({
    status: 200,
    description: 'Novo access token gerado',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  async refresh(
    @Body() refreshDto: RefreshDto,
    @Req() req: ExpressRequest & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    // O refresh token vem do cookie httpOnly (fallback: corpo da requisição)
    const token =
      req.cookies?.[authCookies.refresh] ?? refreshDto.refresh_token;
    const result = await this.authService.refresh(token ?? '');
    this.setAuthCookies(res, result.access_token);
    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Fazer logout' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    type: LogoutResponseDto,
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    // Limpa os cookies httpOnly de autenticação
    this.clearAuthCookies(res);
    return { message: 'Logout realizado com sucesso' };
  }
}
