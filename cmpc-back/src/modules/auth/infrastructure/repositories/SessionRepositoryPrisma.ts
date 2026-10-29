import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma/PrismaService';
import { Session } from '../../domain/entities/Session';
import type {
  CreateSessionData,
  SessionRepositoryPort,
} from '../../domain/ports/SessionRepositoryPort';

interface SessionRow {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class SessionRepositoryPrisma implements SessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSessionData): Promise<Session> {
    const row = await this.prisma.session.create({ data });
    return this.toEntity(row);
  }

  async findById(id: string): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async rotate(
    id: string,
    expectedHash: string,
    newHash: string,
    newExpiresAt: Date,
  ): Promise<boolean> {
    const result = await this.prisma.session.updateMany({
      where: {
        id,
        refreshTokenHash: expectedHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { refreshTokenHash: newHash, expiresAt: newExpiresAt },
    });
    return result.count === 1;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpiredForUser(userId: string, before: Date): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        OR: [{ expiresAt: { lt: before } }, { revokedAt: { lt: before } }],
      },
    });
  }

  private toEntity(row: SessionRow): Session {
    return new Session(
      row.id,
      row.userId,
      row.refreshTokenHash,
      row.userAgent,
      row.ip,
      row.expiresAt,
      row.revokedAt,
      row.createdAt,
    );
  }
}
