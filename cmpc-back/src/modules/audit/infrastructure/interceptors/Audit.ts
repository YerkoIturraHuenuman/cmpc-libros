import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  action: string;
  entity: string;
  bodyFields?: string[];
}

export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
