import { BadRequestException } from '@nestjs/common';
import { CatalogItem } from '../../domain/entities/CatalogItem';
import type { CatalogRepositoryPort } from '../../domain/ports/CatalogRepositoryPort';
import { CreateCatalogItem } from './CreateCatalogItem';
import { ListCatalogItems } from './ListCatalogItems';

describe('casos de uso de catálogo', () => {
  const catalog: jest.Mocked<CatalogRepositoryPort> = {
    list: jest.fn(),
    create: jest.fn(),
    exists: jest.fn(),
  };

  afterEach(() => jest.resetAllMocks());

  describe('ListCatalogItems', () => {
    it('lista los elementos del tipo pedido', async () => {
      catalog.list.mockResolvedValue([new CatalogItem('1', 'Novela')]);

      const result = await new ListCatalogItems(catalog).execute('genres');

      expect(catalog.list).toHaveBeenCalledWith('genres');
      expect(result).toEqual([{ id: '1', name: 'Novela' }]);
    });
  });

  describe('CreateCatalogItem', () => {
    const useCase = new CreateCatalogItem(catalog);

    it('crea el elemento con el nombre recortado', async () => {
      catalog.create.mockResolvedValue(new CatalogItem('2', 'Alfaguara'));

      const result = await useCase.execute('publishers', { name: '  Alfaguara ' });

      expect(catalog.create).toHaveBeenCalledWith('publishers', 'Alfaguara');
      expect(result).toEqual({ id: '2', name: 'Alfaguara' });
    });

    it('rechaza un nombre vacío', async () => {
      await expect(useCase.execute('authors', { name: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(catalog.create).not.toHaveBeenCalled();
    });
  });
});
