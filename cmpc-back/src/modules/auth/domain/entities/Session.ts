export class Session {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly refreshTokenHash: string,
    readonly userAgent: string | null,
    readonly ip: string | null,
    readonly expiresAt: Date,
    readonly revokedAt: Date | null,
    readonly createdAt: Date,
  ) {}

  isActive(now: Date = new Date()): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > now.getTime();
  }
}
