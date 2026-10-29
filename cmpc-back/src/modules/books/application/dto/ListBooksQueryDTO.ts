import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { toBoolean, toList, trim } from '@/common/dto/transforms';
import { BOOK_SORT_FIELDS } from '../../domain/ports/BookRepositoryPort';

const SORT_ITEM = `(?:${BOOK_SORT_FIELDS.join('|')}):(?:asc|desc)`;
const SORT_REGEX = new RegExp(`^${SORT_ITEM}(?:,${SORT_ITEM})*$`);

export const MAX_PAGE_SIZE = 100;
const MAX_FILTER_VALUES = 50;

export class BookFiltersQueryDTO {
  @ApiPropertyOptional({
    description: 'Busca por título o nombre del autor (sin distinguir mayúsculas)',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Ids de género separados por coma',
  })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @ArrayMaxSize(MAX_FILTER_VALUES)
  @IsUUID('all', { each: true })
  genreIds?: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Ids de editorial separados por coma',
  })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @ArrayMaxSize(MAX_FILTER_VALUES)
  @IsUUID('all', { each: true })
  publisherIds?: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Ids de autor separados por coma',
  })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @ArrayMaxSize(MAX_FILTER_VALUES)
  @IsUUID('all', { each: true })
  authorIds?: string[];

  @ApiPropertyOptional({ description: 'true = disponibles, false = no disponibles' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: 'title:asc,price:desc',
    description: `Campos: ${BOOK_SORT_FIELDS.join(', ')}. Formato campo:asc|desc separados por coma`,
  })
  @IsOptional()
  @Matches(SORT_REGEX, {
    message: `sort debe tener el formato campo:asc|desc (campos: ${BOOK_SORT_FIELDS.join(', ')})`,
  })
  sort?: string;
}

export class ListBooksQueryDTO extends BookFiltersQueryDTO {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 10;
}

export class ExportBooksQueryDTO extends OmitType(ListBooksQueryDTO, [
  'page',
  'limit',
] as const) {}
