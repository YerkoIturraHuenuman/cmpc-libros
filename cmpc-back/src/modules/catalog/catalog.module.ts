import { Module } from '@nestjs/common';
import { CATALOG_REPOSITORY } from '@/common/config/di-tokens';
import { CreateCatalogItem } from './application/use-cases/CreateCatalogItem';
import { ListCatalogItems } from './application/use-cases/ListCatalogItems';
import { CatalogController } from './infrastructure/controllers/CatalogController';
import { CatalogRepositoryPrisma } from './infrastructure/repositories/CatalogRepositoryPrisma';

@Module({
  controllers: [CatalogController],
  providers: [
    ListCatalogItems,
    CreateCatalogItem,
    { provide: CATALOG_REPOSITORY, useClass: CatalogRepositoryPrisma },
  ],
  exports: [CATALOG_REPOSITORY],
})
export class CatalogModule {}
