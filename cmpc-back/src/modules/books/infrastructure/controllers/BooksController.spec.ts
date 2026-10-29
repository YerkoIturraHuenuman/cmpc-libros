import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { PaginatedResult } from '@/common/dto/PaginatedResponseDTO';
import type { CreateBook } from '../../application/use-cases/CreateBook';
import type { DeleteBook } from '../../application/use-cases/DeleteBook';
import type { ExportBooksCsv } from '../../application/use-cases/ExportBooksCsv';
import type { GetBookById } from '../../application/use-cases/GetBookById';
import type { ListBooks } from '../../application/use-cases/ListBooks';
import type { UpdateBook } from '../../application/use-cases/UpdateBook';
import { BooksController } from './BooksController';

function setup() {
  const useCases = {
    list: { execute: jest.fn() },
    export: { execute: jest.fn() },
    get: { execute: jest.fn() },
    create: { execute: jest.fn() },
    update: { execute: jest.fn() },
    remove: { execute: jest.fn() },
  };
  const controller = new BooksController(
    useCases.list as unknown as ListBooks,
    useCases.export as unknown as ExportBooksCsv,
    useCases.get as unknown as GetBookById,
    useCases.create as unknown as CreateBook,
    useCases.update as unknown as UpdateBook,
    useCases.remove as unknown as DeleteBook,
  );
  return { controller, useCases };
}

const file = { buffer: Buffer.from('img') } as Express.Multer.File;

describe('BooksController', () => {
  it('list delega con el query', async () => {
    const { controller, useCases } = setup();
    const page = new PaginatedResult([], 0, 1, 10);
    useCases.list.execute.mockResolvedValue(page);
    const query = { page: 1, limit: 10 };

    expect(await controller.list(query)).toBe(page);
    expect(useCases.list.execute).toHaveBeenCalledWith(query);
  });

  it('export devuelve un CSV descargable', async () => {
    const { controller, useCases } = setup();
    useCases.export.execute.mockResolvedValue('ID,Título\r\n');
    const set = jest.fn();

    const result = await controller.export({ search: 'a' }, { set } as unknown as Response);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(set).toHaveBeenCalledWith({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="libros.csv"',
    });
    expect(useCases.export.execute).toHaveBeenCalledWith({ search: 'a' });
  });

  it('get delega con el id', async () => {
    const { controller, useCases } = setup();
    useCases.get.execute.mockResolvedValue({ id: 'b-1' });

    expect(await controller.get('b-1')).toEqual({ id: 'b-1' });
    expect(useCases.get.execute).toHaveBeenCalledWith('b-1');
  });

  it('create pasa el buffer de la imagen subida', async () => {
    const { controller, useCases } = setup();
    const dto = { title: 'x' } as never;

    await controller.create(dto, file);

    expect(useCases.create.execute).toHaveBeenCalledWith(dto, file.buffer);
  });

  it('create sin imagen pasa undefined', async () => {
    const { controller, useCases } = setup();
    const dto = { title: 'x' } as never;

    await controller.create(dto);

    expect(useCases.create.execute).toHaveBeenCalledWith(dto, undefined);
  });

  it('update pasa id, datos e imagen', async () => {
    const { controller, useCases } = setup();
    const dto = { price: 5 } as never;

    await controller.update('b-1', dto, file);

    expect(useCases.update.execute).toHaveBeenCalledWith('b-1', dto, file.buffer);
  });

  it('remove delega con el id', async () => {
    const { controller, useCases } = setup();
    useCases.remove.execute.mockResolvedValue(undefined);

    await controller.remove('b-1');

    expect(useCases.remove.execute).toHaveBeenCalledWith('b-1');
  });
});
