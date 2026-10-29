import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  SESSION_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import type { UserRepositoryPort } from '@/modules/users/domain/ports/UserRepositoryPort';
import { UserResponseDTO } from '@/modules/users/application/dto/UserResponseDTO';
import type { SessionRepositoryPort } from '../../domain/ports/SessionRepositoryPort';
import type { TokenServicePort } from '../../domain/ports/TokenServicePort';
import type { TokenResponseDTO } from '../dto/TokenResponseDTO';

const INVALID_SESSION = 'Sesión inválida o expirada';

@Injectable()
export class RefreshToken {
  private readonly flow = new FlowLogger(RefreshToken.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
  ) {}

  execute(refreshToken: string): Promise<TokenResponseDTO> {
    return this.flow.track(
      'execute',
      undefined,
      () => this.refresh(refreshToken),
      (result) => ({ userId: result.user.id }),
    );
  }

  private async refresh(refreshToken: string): Promise<TokenResponseDTO> {
    const payload = await this.tokens.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const session = await this.sessions.findById(payload.sid);
    if (!session || session.userId !== payload.sub || !session.isActive()) {
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const newRefreshToken = await this.tokens.signRefreshToken({
      sub: user.id,
      sid: session.id,
    });

    const rotated = await this.sessions.rotate(
      session.id,
      this.tokens.hashToken(refreshToken),
      this.tokens.hashToken(newRefreshToken),
      new Date(Date.now() + this.tokens.refreshTtlMs),
    );

    if (!rotated) {
      this.flow.error('refresh', new Error('Refresh token reutilizado: se revocan todas las sesiones'), {
        userId: user.id,
        sessionId: session.id,
      });
      await this.sessions.revokeAllForUser(user.id);
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: UserResponseDTO.from(user),
    };
  }
}
