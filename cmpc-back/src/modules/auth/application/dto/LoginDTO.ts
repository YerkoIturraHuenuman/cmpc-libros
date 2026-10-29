import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { trim } from '@/common/dto/transforms';

export class LoginDTO {
  @ApiProperty({ example: 'admin@cmpc.test' })
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ minLength: 1, maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
