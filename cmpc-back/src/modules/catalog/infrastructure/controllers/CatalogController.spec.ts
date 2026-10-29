import type { CreateCatalogItem } from '../../application/use-cases/CreateCatalogItem';
import type { ListCatalogItems } from '../../application/use-cases/ListCatalogItems';
import { CatalogController } from './CatalogController';

describe('CatalogController', () => {
  const list = { execute: jest.fn().mockResolvedValue([{ id: '1', name: 'Novela' }]) };
  const create = { execute: jest.fn().mockResolvedValue({ id: '2', name: 'Nuevo' }) };
  const controller = new CatalogController(
    list as unknown as ListCatalogItems,
    create as unknown as CreateCatalogItem,
  );

  it('list delega en el caso de uso con el tipo de la URL', async () => {
    expect(await controller.list('genres')).toEqual([{ id: '1', name: 'Novela' }]);
    expect(list.execute).toHaveBeenCalledWith('genres');
  });

  it('create delega con el tipo y el body', async () => {
    expect(await controller.create('authors', { name: 'Nuevo' })).toEqual({
      id: '2',
      name: 'Nuevo',
    });
    expect(create.execute).toHaveBeenCalledWith('authors', { name: 'Nuevo' });
  });
});
