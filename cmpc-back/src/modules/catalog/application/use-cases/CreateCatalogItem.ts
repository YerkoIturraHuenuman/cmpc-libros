import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CATALOG_REPOSITORY } from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import type { CatalogKind } from '../../domain/entities/CatalogItem';
import type { CatalogRepositoryPort } from '../../domain/ports/CatalogRepositoryPort';
import { CatalogItemResponseDTO } from '../dto/CatalogDTO';
import type { CreateCatalogItemDTO } from '../dto/CatalogDTO';

@Injectable()
export class CreateCatalogItem {
  private readonly flow = new FlowLogger(CreateCatalogItem.name);

  constructor(
    @Inject(CATALOG_REPOSITORY) private readonly catalog: CatalogRepositoryPort,
  ) {}

  execute(
    kind: CatalogKind,
    dto: CreateCatalogItemDTO,
  ): Promise<CatalogItemResponseDTO> {
    return this.flow.track(
      'execute',
      { kind, name: dto.name },
      async () => {
        const name = dto.name.trim();
        if (name.length === 0) {
          throw new BadRequestException('El nombre no puede estar vacío');
        }
        const item = await this.catalog.create(kind, name);
        return CatalogItemResponseDTO.from(item);
      },
      (item) => ({ id: item.id }),
    );
  }
}
