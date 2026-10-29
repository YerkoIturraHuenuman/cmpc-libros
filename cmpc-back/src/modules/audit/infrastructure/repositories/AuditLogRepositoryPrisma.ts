import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma/PrismaService';
import type { Prisma } from '@/common/database/prisma/generated/client';
import type {
  AuditLogPort,
  NewAuditEntry,
} from '../../domain/ports/AuditLogPort';

@Injectable()
export class AuditLogRepositoryPrisma implements AuditLogPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: NewAuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: entry.metadata
          ? (entry.metadata as Prisma.InputJsonObject)
          : undefined,
      },
    });
  }
}
