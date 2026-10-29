import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '@/common/dto/PaginatedResponseDTO';
import type { CatalogRepositoryPort } from '@/modules/catalog/domain/ports/CatalogRepositoryPort';
import { makeBook } from '../../domain/entities/Book.fixture';
import { StaleBookError, type BookRepositoryPort } from '../../domain/ports/BookRepositoryPort';
import type { CsvExporterPort } from '../../domain/ports/CsvExporterPort';
import type { FileStoragePort } from '../../domain/ports/FileStoragePort';
import {
  InvalidImageError,
  type ImageSanitizerPort,
} from '../../domain/ports/ImageSanitizerPort';
import type { CreateBookDTO } from '../dto/CreateBookDTO';
import { CreateBook } from './CreateBook';
import { DeleteBook } from './DeleteBook';
import { EnsureCatalogReferences } from './EnsureCatalogReferences';
import { ExportBooksCsv } from './ExportBooksCsv';
import { GetBookById } from './GetBookById';
import { ListBooks } from './ListBooks';
import { UpdateBook } from './UpdateBook';
import { UploadBookImage } from './UploadBookImage';

const books: jest.Mocked<BookRepositoryPort> = {
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  findAll: jest.fn(),
};
const storage: jest.Mocked<FileStoragePort> = { upload: jest.fn(), delete: jest.fn() };
const sanitizer: jest.Mocked<ImageSanitizerPort> = { sanitize: jest.fn() };
const catalog: jest.Mocked<CatalogRepositoryPort> = {
  list: jest.fn(),
  create: jest.fn(),
  exists: jest.fn(),
};
const csv: jest.Mocked<CsvExporterPort> = { export: jest.fn() };

const ensureReferences = { execute: jest.fn() };
const uploadImage = { execute: jest.fn() };

const dto: CreateBookDTO = {
  title: '  Rayuela ',
  price: 9990,
  authorId: 'a-1',
  publisherId: 'p-1',
  genreId: 'g-1',
};
const image = Buffer.from('imagen');

beforeEach(() => {
  jest.resetAllMocks();
  storage.delete.mockResolvedValue(undefined);
  ensureReferences.execute.mockResolvedValue(undefined);
});

describe('EnsureCatalogReferences', () => {
  const useCase = new EnsureCatalogReferences(catalog);

  it('no falla si todo existe', async () => {
    catalog.exists.mockResolvedValue(true);

    await expect(
      useCase.execute({ authorId: 'a', publisherId: 'p', genreId: 'g' }),
    ).resolves.toBeUndefined();
    expect(catalog.exists).toHaveBeenCalledWith('authors', 'a');
    expect(catalog.exists).toHaveBeenCalledWith('publishers', 'p');
    expect(catalog.exists).toHaveBeenCalledWith('genres', 'g');
  });

  it('solo comprueba los ids que vienen', async () => {
    await useCase.execute({});
    expect(catalog.exists).not.toHaveBeenCalled();
  });

  it.each([
    ['authors', { authorId: 'x' }, 'autor'],
    ['publishers', { publisherId: 'x' }, 'editorial'],
    ['genres', { genreId: 'x' }, 'género'],
  ])('avisa si el %s no existe', async (_kind, refs, label) => {
    catalog.exists.mockResolvedValue(false);

    await expect(useCase.execute(refs)).rejects.toThrow(`El ${label} indicado no existe`);
  });
});

describe('UploadBookImage', () => {
  const useCase = new UploadBookImage(sanitizer, storage);

  it('sanitiza antes de subir y sube la versión limpia', async () => {
    sanitizer.sanitize.mockResolvedValue(Buffer.from('limpia'));
    storage.upload.mockResolvedValue('https://img/1.webp');

    expect(await useCase.execute(image)).toBe('https://img/1.webp');
    expect(sanitizer.sanitize).toHaveBeenCalledWith(image);
    expect(storage.upload).toHaveBeenCalledWith(Buffer.from('limpia'));
  });

  it('una imagen inválida es un 400 y no se sube nada', async () => {
    sanitizer.sanitize.mockRejectedValue(new InvalidImageError('Formato no permitido'));

    await expect(useCase.execute(image)).rejects.toThrow(BadRequestException);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('propaga los errores inesperados', async () => {
    sanitizer.sanitize.mockRejectedValue(new Error('sharp murió'));
    await expect(useCase.execute(image)).rejects.toThrow('sharp murió');
  });
});

describe('CreateBook', () => {
  const useCase = new CreateBook(
    books,
    storage,
    ensureReferences as unknown as EnsureCatalogReferences,
    uploadImage as unknown as UploadBookImage,
  );

  it('crea el libro sin imagen, disponible por defecto y con el título recortado', async () => {
    books.create.mockResolvedValue(makeBook());

    const result = await useCase.execute(dto);

    expect(books.create).toHaveBeenCalledWith({
      title: 'Rayuela',
      price: 9990,
      isAvailable: true,
      imageUrl: null,
      authorId: 'a-1',
      publisherId: 'p-1',
      genreId: 'g-1',
    });
    expect(ensureReferences.execute).toHaveBeenCalledWith(dto);
    expect(uploadImage.execute).not.toHaveBeenCalled();
    expect(result.id).toBe('b-1');
  });

  it('sube la imagen y guarda su URL', async () => {
    uploadImage.execute.mockResolvedValue('https://img/1.webp');
    books.create.mockResolvedValue(makeBook());

    await useCase.execute({ ...dto, isAvailable: false }, image);

    expect(books.create).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: 'https://img/1.webp', isAvailable: false }),
    );
  });

  it('valida las reglas de negocio antes de tocar nada', async () => {
    await expect(useCase.execute({ ...dto, title: '   ' }, image)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(ensureReferences.execute).not.toHaveBeenCalled();
    expect(uploadImage.execute).not.toHaveBeenCalled();
    expect(books.create).not.toHaveBeenCalled();
  });

  it('no sube la imagen si autor/editorial/género no existen', async () => {
    ensureReferences.execute.mockRejectedValue(new BadRequestException());

    await expect(useCase.execute(dto, image)).rejects.toBeInstanceOf(BadRequestException);
    expect(uploadImage.execute).not.toHaveBeenCalled();
  });

  it('borra la imagen subida si falla el guardado (sin huérfanas)', async () => {
    uploadImage.execute.mockResolvedValue('https://img/1.webp');
    books.create.mockRejectedValue(new Error('db caída'));

    await expect(useCase.execute(dto, image)).rejects.toThrow('db caída');
    expect(storage.delete).toHaveBeenCalledWith('https://img/1.webp');
  });

  it('si falla sin imagen no intenta borrar nada', async () => {
    books.create.mockRejectedValue(new Error('db caída'));

    await expect(useCase.execute(dto)).rejects.toThrow('db caída');
    expect(storage.delete).not.toHaveBeenCalled();
  });
});

describe('UpdateBook', () => {
  const useCase = new UpdateBook(
    books,
    storage,
    ensureReferences as unknown as EnsureCatalogReferences,
    uploadImage as unknown as UploadBookImage,
  );
  const existing = makeBook({ imageUrl: 'https://img/old.webp' });

  beforeEach(() => {
    books.findById.mockResolvedValue(existing);
    books.update.mockResolvedValue(makeBook({ title: 'Nuevo' }));
  });

  it('actualiza solo los campos enviados', async () => {
    const result = await useCase.execute('b-1', { title: ' Nuevo ', price: 5 });

    expect(books.update).toHaveBeenCalledWith('b-1', {
      title: 'Nuevo',
      price: 5,
      isAvailable: undefined,
      authorId: undefined,
      publisherId: undefined,
      genreId: undefined,
    }, undefined);
    expect(result.title).toBe('Nuevo');
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('404 si el libro no existe o está eliminado', async () => {
    books.findById.mockResolvedValue(null);

    await expect(useCase.execute('x', {})).rejects.toBeInstanceOf(NotFoundException);
    expect(books.update).not.toHaveBeenCalled();
  });

  it('rechaza datos que rompen las reglas del dominio', async () => {
    await expect(useCase.execute('b-1', { price: -1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('reemplaza la portada: sube la nueva y borra la anterior al final', async () => {
    uploadImage.execute.mockResolvedValue('https://img/new.webp');

    await useCase.execute('b-1', {}, image);

    expect(books.update).toHaveBeenCalledWith(
      'b-1',
      expect.objectContaining({ imageUrl: 'https://img/new.webp' }),
      undefined,
    );
    expect(storage.delete).toHaveBeenCalledWith('https://img/old.webp');
  });

  it('removeImage deja el libro sin portada y borra el archivo', async () => {
    await useCase.execute('b-1', { removeImage: true });

    expect(books.update).toHaveBeenCalledWith(
      'b-1',
      expect.objectContaining({ imageUrl: null }),
      undefined,
    );
    expect(storage.delete).toHaveBeenCalledWith('https://img/old.webp');
  });

  it('entrega al repositorio la versión que la persona vio al abrir el libro', async () => {
    await useCase.execute('b-1', { expectedUpdatedAt: '2026-01-02T10:00:00.000Z' });

    expect(books.update).toHaveBeenCalledWith(
      'b-1',
      expect.any(Object),
      new Date('2026-01-02T10:00:00.000Z'),
    );
  });

  it('409 si el libro cambió mientras se editaba, y borra la imagen nueva', async () => {
    uploadImage.execute.mockResolvedValue('https://img/new.webp');
    books.update.mockRejectedValue(new StaleBookError());

    await expect(
      useCase.execute('b-1', { expectedUpdatedAt: '2026-01-02T10:00:00.000Z' }, image),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storage.delete).toHaveBeenCalledWith('https://img/new.webp');
  });

  it('removeImage en un libro sin portada no borra nada', async () => {
    books.findById.mockResolvedValue(makeBook({ imageUrl: null }));

    await useCase.execute('b-1', { removeImage: true });

    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('si el libro se eliminó mientras tanto, borra la imagen nueva y da 404', async () => {
    uploadImage.execute.mockResolvedValue('https://img/new.webp');
    books.update.mockResolvedValue(null);

    await expect(useCase.execute('b-1', {}, image)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.delete).toHaveBeenCalledWith('https://img/new.webp');
    expect(storage.delete).not.toHaveBeenCalledWith('https://img/old.webp');
  });

  it('si falla el guardado, borra la imagen nueva y conserva la anterior', async () => {
    uploadImage.execute.mockResolvedValue('https://img/new.webp');
    books.update.mockRejectedValue(new Error('db caída'));

    await expect(useCase.execute('b-1', {}, image)).rejects.toThrow('db caída');
    expect(storage.delete).toHaveBeenCalledWith('https://img/new.webp');
    expect(storage.delete).not.toHaveBeenCalledWith('https://img/old.webp');
  });

  it('un error sin imagen nueva no borra nada', async () => {
    books.update.mockRejectedValue(new Error('db caída'));

    await expect(useCase.execute('b-1', {})).rejects.toThrow('db caída');
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('sin imagen nueva y con libro eliminado en el medio, solo da 404', async () => {
    books.update.mockResolvedValue(null);

    await expect(useCase.execute('b-1', {})).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.delete).not.toHaveBeenCalled();
  });
});

describe('DeleteBook', () => {
  const useCase = new DeleteBook(books);

  it('hace soft delete', async () => {
    books.softDelete.mockResolvedValue(true);
    await expect(useCase.execute('b-1')).resolves.toBeUndefined();
    expect(books.softDelete).toHaveBeenCalledWith('b-1');
  });

  it('404 si no existe o ya estaba eliminado', async () => {
    books.softDelete.mockResolvedValue(false);
    await expect(useCase.execute('b-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('GetBookById', () => {
  const useCase = new GetBookById(books);

  it('devuelve el libro', async () => {
    books.findById.mockResolvedValue(makeBook());
    expect((await useCase.execute('b-1')).title).toBe('Cien años de soledad');
  });

  it('404 si no existe', async () => {
    books.findById.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ListBooks', () => {
  it('pasa filtros y página al repositorio y arma el resultado paginado', async () => {
    books.list.mockResolvedValue({ items: [makeBook()], total: 31 });

    const result = await new ListBooks(books).execute({
      page: 2,
      limit: 10,
      search: 'cien',
      sort: 'price:asc',
    });

    expect(books.list).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'cien',
        sort: [{ field: 'price', direction: 'asc' }],
      }),
      { page: 2, limit: 10 },
    );
    expect(result).toBeInstanceOf(PaginatedResult);
    expect(result).toMatchObject({ total: 31, page: 2, limit: 10 });
    expect(result.totalPages).toBe(4);
    expect(result.items[0].title).toBe('Cien años de soledad');
  });
});

describe('ExportBooksCsv', () => {
  it('exporta todos los libros que cumplen los filtros', async () => {
    books.findAll.mockResolvedValue([makeBook()]);
    csv.export.mockReturnValue('a,b');

    const result = await new ExportBooksCsv(books, csv).execute({ isAvailable: true });

    expect(books.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ isAvailable: true }),
    );
    expect(csv.export).toHaveBeenCalledWith([expect.objectContaining({ id: 'b-1' })]);
    expect(result).toBe('a,b');
  });
});
