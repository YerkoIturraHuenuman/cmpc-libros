import { randomUUID } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  SESSION_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import type { UserRepositoryPort } from '@/modules/users/domain/ports/UserRepositoryPort';
import { UserResponseDTO } from '@/modules/users/application/dto/UserResponseDTO';
import type { PasswordHasherPort } from '../../domain/ports/PasswordHasherPort';
import type { SessionRepositoryPort } from '../../domain/ports/SessionRepositoryPort';
import type { TokenServicePort } from '../../domain/ports/TokenServicePort';
import type { TokenResponseDTO } from '../dto/TokenResponseDTO';

const EXPIRED_SESSION_RETENTION_MS = 24 * 60 * 60 * 1000;

export interface LoginInput {
  email: string;
  password: string;
  userAgent: string | null;
  ip: string | null;
}

@Injectable()
export class Login {
  private readonly flow = new FlowLogger(Login.name);
  private dummyHash?: Promise<string>;

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
  ) {}

  execute(input: LoginInput): Promise<TokenResponseDTO> {
    return this.flow.track(
      'execute',
      { email: input.email, ip: input.ip },
      () => this.login(input),
      (result) => ({ userId: result.user.id }),
    );
  }

  private async login(input: LoginInput): Promise<TokenResponseDTO> {
    const user = await this.users.findByEmail(input.email.toLowerCase());

    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const passwordMatches = await this.hasher.compare(input.password, hash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const sessionId = randomUUID();
    const refreshToken = await this.tokens.signRefreshToken({
      sub: user.id,
      sid: sessionId,
    });

    await this.sessions.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.tokens.hashToken(refreshToken),
      userAgent: input.userAgent,
      ip: input.ip,
      expiresAt: new Date(Date.now() + this.tokens.refreshTtlMs),
    });

    try {
      await this.sessions.deleteExpiredForUser(
        user.id,
        new Date(Date.now() - EXPIRED_SESSION_RETENTION_MS),
      );
    } catch (error) {
      this.flow.error('deleteExpiredSessions', error, { userId: user.id });
    }

    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      sid: sessionId,
      role: user.role,
    });

    return { accessToken, refreshToken, user: UserResponseDTO.from(user) };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash(randomUUID());
    return this.dummyHash;
  }
}
