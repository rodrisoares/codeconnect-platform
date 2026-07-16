import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants, authCookies } from './constants';

type RequestWithCookies = Request & { cookies?: Record<string, string> };

/**
 * Guard que NÃO bloqueia a requisição quando não há token.
 * Se um token válido for enviado, popula `request.user`; caso contrário,
 * apenas segue em frente. Útil para endpoints públicos que exibem
 * informações extras para usuários autenticados (ex.: "isFollowing").
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        request['user'] = await this.jwtService.verifyAsync(token, {
          secret: jwtConstants.secret,
        });
      } catch {
        // Token inválido/expirado: trata como visitante anônimo
      }
    }

    return true;
  }

  private extractTokenFromHeader(
    request: RequestWithCookies,
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) return token;
    return request.cookies?.[authCookies.access];
  }
}
