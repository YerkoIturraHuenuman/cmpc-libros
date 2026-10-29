import type { UserRole } from '@/common/dto/AuthenticatedUserDTO';

export class User {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly name: string,
    readonly role: UserRole,
    readonly passwordHash: string,
    readonly createdAt: Date,
  ) {}

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }
}
