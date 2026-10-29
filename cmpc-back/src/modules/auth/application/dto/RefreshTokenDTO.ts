import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDTO {
  @ApiPropertyOptional({
    description:
      'Refresh token. Si se omite, se lee de la cookie "refresh_token".',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
