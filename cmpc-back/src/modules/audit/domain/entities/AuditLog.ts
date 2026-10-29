export class AuditLog {
  constructor(
    readonly id: string,
    readonly userId: string | null,
    readonly action: string,
    readonly entity: string,
    readonly entityId: string | null,
    readonly metadata: Record<string, unknown> | null,
    readonly createdAt: Date,
  ) {}
}
