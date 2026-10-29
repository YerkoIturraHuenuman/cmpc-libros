import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '@/common/dto/AuthenticatedUserDTO';
import type { User } from '../../domain/entities/User';

export class UserResponseDTO {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ['ADMIN', 'USER'] }) role: UserRole;
  @ApiProperty() createdAt: Date;

  static from(user: User): UserResponseDTO {
    const dto = new UserResponseDTO();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.role = user.role;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
