import { request } from '@/services/httpClient';
import { catalogService } from './catalogService';

jest.mock('@/services/httpClient');

describe('catalogService', () => {
  beforeEach(() => jest.resetAllMocks());

  it('lista cada catálogo por su tipo', async () => {
    const signal = new AbortController().signal;
    jest.mocked(request).mockResolvedValue([{ id: '1', name: 'Novela' }]);

    await expect(catalogService.list('genres', signal)).resolves.toEqual([
      { id: '1', name: 'Novela' },
    ]);
    expect(request).toHaveBeenCalledWith('/catalog/genres', { signal });
  });

  it('crea un elemento enviando el nombre como JSON', async () => {
    jest.mocked(request).mockResolvedValue({ id: '9', name: 'Ensayo' });

    await expect(catalogService.create('genres', 'Ensayo')).resolves.toEqual({
      id: '9',
      name: 'Ensayo',
    });
    expect(request).toHaveBeenCalledWith('/catalog/genres', {
      method: 'POST',
      json: { name: 'Ensayo' },
    });
  });
});
