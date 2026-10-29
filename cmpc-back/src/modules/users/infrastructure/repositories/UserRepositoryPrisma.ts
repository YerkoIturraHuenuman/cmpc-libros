import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma/PrismaService';
import { User } from '../../domain/entities/User';
import type { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  passwordHash: string;
  createdAt: Date;
}

@Injectable()
export class UserRepositoryPrisma implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  private toEntity(row: UserRow): User {
    return new User(
      row.id,
      row.email,
      row.name,
      row.role,
      row.passwordHash,
      row.createdAt,
    );
  }
}
