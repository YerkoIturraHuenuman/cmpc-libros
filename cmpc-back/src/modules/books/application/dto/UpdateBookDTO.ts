import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsISO8601, IsOptional } from 'class-validator';
import { toBoolean } from '@/common/dto/transforms';
import { CreateBookDTO } from './CreateBookDTO';

export class UpdateBookDTO extends PartialType(CreateBookDTO) {
  @ApiPropertyOptional({ description: 'Elimina la portada actual del libro' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  removeImage?: boolean;

  @ApiPropertyOptional({
    description:
      'Valor de updatedAt que tenía el libro al leerlo. Si cambió desde entonces, responde 409',
    example: '2026-01-02T10:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  expectedUpdatedAt?: string;
}
