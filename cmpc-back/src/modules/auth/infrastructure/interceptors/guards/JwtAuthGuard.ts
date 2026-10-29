import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SESSION_REPOSITORY, TOKEN_SERVICE } from '@/common/config/di-tokens';
import type { AuthenticatedUser } from '@/common/dto/AuthenticatedUserDTO';
import type { SessionRepositoryPort } from '../../../domain/ports/SessionRepositoryPort';
import type { TokenServicePort } from '../../../domain/ports/TokenServicePort';
import { IS_PUBLIC_KEY } from './Public';

export const ACCESS_COOKIE = 'access_token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de autenticación');
    }

    const payload = await this.tokens.verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const session = await this.sessions.findById(payload.sid);
    if (!session || session.userId !== payload.sub || !session.isActive()) {
      throw new UnauthorizedException('La sesión ya no es válida');
    }

    request.user = {
      userId: payload.sub,
      sessionId: payload.sid,
      role: payload.role,
    };
    return true;
  }

  private extractToken(request: Request): string | null {
    const [scheme, bearer] = request.headers.authorization?.split(' ') ?? [];
    if (scheme === 'Bearer' && bearer) {
      return bearer;
    }
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[ACCESS_COOKIE] ?? null;
  }
}
