export interface NewAuditEntry {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditLogPort {
  record(entry: NewAuditEntry): Promise<void>;
}
