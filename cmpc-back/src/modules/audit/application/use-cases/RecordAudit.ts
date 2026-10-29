import { Inject, Injectable, Logger } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from '@/common/config/di-tokens';
import type {
  AuditLogPort,
  NewAuditEntry,
} from '../../domain/ports/AuditLogPort';

@Injectable()
export class RecordAudit {
  private readonly logger = new Logger('Audit');

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogPort,
  ) {}

  async execute(entry: NewAuditEntry): Promise<void> {
    this.logger.log(
      JSON.stringify({
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: entry.metadata,
      }),
    );

    try {
      await this.auditLog.record(entry);
    } catch (error) {
      this.logger.error(
        'No se pudo guardar el registro de auditoría',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
