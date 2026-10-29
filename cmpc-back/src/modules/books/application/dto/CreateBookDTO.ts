import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { toBoolean, trim } from '@/common/dto/transforms';
import { MAX_PRICE } from '../../domain/entities/Book';

export class CreateBookDTO {
  @ApiProperty({ maxLength: 255, example: 'Cien años de soledad' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 12990.5, description: 'Hasta 2 decimales' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_PRICE)
  price: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  authorId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  publisherId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  genreId: string;
}
