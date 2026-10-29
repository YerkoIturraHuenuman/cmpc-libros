import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AUDIT_LOG_REPOSITORY } from '@/common/config/di-tokens';
import { RecordAudit } from './application/use-cases/RecordAudit';
import { AuditInterceptor } from './infrastructure/interceptors/AuditInterceptor';
import { AuditLogRepositoryPrisma } from './infrastructure/repositories/AuditLogRepositoryPrisma';

@Module({
  providers: [
    RecordAudit,
    { provide: AUDIT_LOG_REPOSITORY, useClass: AuditLogRepositoryPrisma },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [RecordAudit],
})
export class AuditModule {}
