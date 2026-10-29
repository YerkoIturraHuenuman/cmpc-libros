import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Audit } from '@/modules/audit/infrastructure/interceptors/Audit';
import {
  CatalogItemResponseDTO,
  CreateCatalogItemDTO,
} from '../../application/dto/CatalogDTO';
import { CreateCatalogItem } from '../../application/use-cases/CreateCatalogItem';
import { ListCatalogItems } from '../../application/use-cases/ListCatalogItems';
import { CATALOG_KINDS, type CatalogKind } from '../../domain/entities/CatalogItem';

const KIND_ENUM = Object.fromEntries(CATALOG_KINDS.map((kind) => [kind, kind]));

@ApiTags('catalog')
@ApiBearerAuth()
@ApiCookieAuth('access_token')
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly listItems: ListCatalogItems,
    private readonly createItem: CreateCatalogItem,
  ) {}

  @Get(':kind')
  @ApiParam({ name: 'kind', enum: CATALOG_KINDS })
  @ApiOkResponse({ type: [CatalogItemResponseDTO] })
  list(
    @Param('kind', new ParseEnumPipe(KIND_ENUM)) kind: CatalogKind,
  ): Promise<CatalogItemResponseDTO[]> {
    return this.listItems.execute(kind);
  }

  @Post(':kind')
  @Audit({ action: 'CREATE', entity: 'Catalog' })
  @ApiParam({ name: 'kind', enum: CATALOG_KINDS })
  @ApiCreatedResponse({ type: CatalogItemResponseDTO })
  create(
    @Param('kind', new ParseEnumPipe(KIND_ENUM)) kind: CatalogKind,
    @Body() dto: CreateCatalogItemDTO,
  ): Promise<CatalogItemResponseDTO> {
    return this.createItem.execute(kind, dto);
  }
}
