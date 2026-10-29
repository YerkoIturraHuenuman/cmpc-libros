import type { Session } from '../entities/Session';

export interface CreateSessionData {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: Date;
}

export interface SessionRepositoryPort {
  create(data: CreateSessionData): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  rotate(
    id: string,
    expectedHash: string,
    newHash: string,
    newExpiresAt: Date,
  ): Promise<boolean>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpiredForUser(userId: string, before: Date): Promise<void>;
}
