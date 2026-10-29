import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { parseDurationMs } from '@/common/config/duration';
import type { UserRole } from '@/common/dto/AuthenticatedUserDTO';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenServicePort,
} from '../../domain/ports/TokenServicePort';

type TokenType = 'access' | 'refresh';

interface RawPayload {
  sub?: unknown;
  sid?: unknown;
  role?: unknown;
  type?: unknown;
}

@Injectable()
export class JwtTokenService implements TokenServicePort {
  readonly accessTtlMs: number;
  readonly refreshTtlMs: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessTtlMs = parseDurationMs(
      config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '5m',
    );
    this.refreshTtlMs = parseDurationMs(
      config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '5m',
    );
  }

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, type: 'access' satisfies TokenType },
      this.signOptions(this.accessSecret, this.accessTtlMs),
    );
  }

  signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, type: 'refresh' satisfies TokenType },
      {
        ...this.signOptions(this.refreshSecret, this.refreshTtlMs),
        jwtid: randomUUID(),
      },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
    const payload = await this.verify(token, this.accessSecret, 'access');
    if (!payload || !this.isRole(payload.role)) {
      return null;
    }
    return { sub: payload.sub, sid: payload.sid, role: payload.role };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    const payload = await this.verify(token, this.refreshSecret, 'refresh');
    return payload ? { sub: payload.sub, sid: payload.sid } : null;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private signOptions(secret: string, ttlMs: number): JwtSignOptions {
    return { secret, expiresIn: Math.floor(ttlMs / 1000) };
  }

  private async verify(
    token: string,
    secret: string,
    type: TokenType,
  ): Promise<{ sub: string; sid: string; role?: unknown } | null> {
    try {
      const payload = await this.jwt.verifyAsync<RawPayload>(token, { secret });
      if (
        payload.type !== type ||
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string'
      ) {
        return null;
      }
      return { sub: payload.sub, sid: payload.sid, role: payload.role };
    } catch {
      return null;
    }
  }

  private isRole(value: unknown): value is UserRole {
    return value === 'ADMIN' || value === 'USER';
  }
}
