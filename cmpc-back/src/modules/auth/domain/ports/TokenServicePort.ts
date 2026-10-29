import type { UserRole } from '@/common/dto/AuthenticatedUserDTO';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
}

export interface TokenServicePort {
  readonly accessTtlMs: number;
  readonly refreshTtlMs: number;
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
  signRefreshToken(payload: RefreshTokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload | null>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null>;
  hashToken(token: string): string;
}
