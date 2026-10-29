import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDTO } from '@/modules/users/application/dto/UserResponseDTO';

export class TokenResponseDTO {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty({ type: UserResponseDTO }) user: UserResponseDTO;
}

export class SessionResponseDTO {
  @ApiProperty({ type: UserResponseDTO }) user: UserResponseDTO;
}
