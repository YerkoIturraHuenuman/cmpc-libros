import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trim } from '@/common/dto/transforms';
import type { CatalogItem } from '../../domain/entities/CatalogItem';

export class CreateCatalogItemDTO {
  @ApiProperty({ example: 'Gabriel García Márquez', maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;
}

export class CatalogItemResponseDTO {
  @ApiProperty() id: string;
  @ApiProperty() name: string;

  static from(item: CatalogItem): CatalogItemResponseDTO {
    const dto = new CatalogItemResponseDTO();
    dto.id = item.id;
    dto.name = item.name;
    return dto;
  }
}
