import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '@/common/config/di-tokens';
import type { UserRepositoryPort } from '../../domain/ports/UserRepositoryPort';
import { UserResponseDTO } from '../dto/UserResponseDTO';

@Injectable()
export class GetMyProfile {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
  ) {}

  async execute(userId: string): Promise<UserResponseDTO> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return UserResponseDTO.from(user);
  }
}
