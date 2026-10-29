import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BookResponseDTO } from './BookResponseDTO';
import { CreateBookDTO } from './CreateBookDTO';
import { ExportBooksQueryDTO, ListBooksQueryDTO } from './ListBooksQueryDTO';
import { UpdateBookDTO } from './UpdateBookDTO';
import { makeBook } from '../../domain/entities/Book.fixture';

const ID_A = '3b1d1d8e-6a2f-4f44-9d5b-0d8d8a0a1111';
const ID_B = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

async function check<T extends object>(cls: new () => T, plain: object) {
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { instance, errors, fields: errors.map((e) => e.property) };
}

describe('ListBooksQueryDTO', () => {
  it('aplica page=1 y limit=10 por defecto', async () => {
    const { instance, errors } = await check(ListBooksQueryDTO, {});
    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({ page: 1, limit: 10 });
  });

  it('convierte los valores del query string a sus tipos', async () => {
    const { instance, errors } = await check(ListBooksQueryDTO, {
      page: '2',
      limit: '20',
      search: '  rayuela ',
      genreIds: `${ID_A},${ID_B}`,
      publisherIds: ID_A,
      isAvailable: 'true',
      sort: 'title:asc,price:desc',
    });

    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({
      page: 2,
      limit: 20,
      search: 'rayuela',
      genreIds: [ID_A, ID_B],
      publisherIds: [ID_A],
      isAvailable: true,
    });
  });

  it('acepta isAvailable=false', async () => {
    const { instance } = await check(ListBooksQueryDTO, { isAvailable: 'false' });
    expect(instance.isAvailable).toBe(false);
  });

  it.each([
    ['sort con un campo no permitido', { sort: 'passwordHash:asc' }, 'sort'],
    ['sort con dirección inválida', { sort: 'title:up' }, 'sort'],
    ['sort con inyección', { sort: 'title:asc;drop table' }, 'sort'],
    ['page menor a 1', { page: '0' }, 'page'],
    ['limit sobre el máximo', { limit: '101' }, 'limit'],
    ['limit no numérico', { limit: 'mucho' }, 'limit'],
    ['ids que no son UUID', { genreIds: 'uno,dos' }, 'genreIds'],
    ['isAvailable inválido', { isAvailable: 'quizas' }, 'isAvailable'],
    ['más ids de los permitidos', { authorIds: Array(51).fill(ID_A).join(',') }, 'authorIds'],
    ['campos desconocidos', { admin: 'true' }, 'admin'],
  ])('rechaza %s', async (_label, plain, field) => {
    const { fields } = await check(ListBooksQueryDTO, plain);
    expect(fields).toContain(field);
  });
});

describe('ExportBooksQueryDTO', () => {
  it('acepta filtros pero no paginación', async () => {
    expect((await check(ExportBooksQueryDTO, { search: 'a' })).errors).toHaveLength(0);
    expect((await check(ExportBooksQueryDTO, { page: '2' })).fields).toContain('page');
  });
});

describe('CreateBookDTO', () => {
  const valid = {
    title: '  Rayuela ',
    price: '12990.5',
    authorId: ID_A,
    publisherId: ID_A,
    genreId: ID_B,
  };

  it('convierte el precio y recorta el título (llegan como texto en multipart)', async () => {
    const { instance, errors } = await check(CreateBookDTO, valid);
    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({ title: 'Rayuela', price: 12990.5 });
  });

  it('convierte isAvailable desde texto', async () => {
    const { instance } = await check(CreateBookDTO, { ...valid, isAvailable: 'false' });
    expect(instance.isAvailable).toBe(false);
  });

  it.each([
    ['sin título', { title: '   ' }, 'title'],
    ['título demasiado largo', { title: 'x'.repeat(256) }, 'title'],
    ['precio negativo', { price: '-1' }, 'price'],
    ['más de 2 decimales', { price: '10.999' }, 'price'],
    ['precio sobre el máximo', { price: '100000000' }, 'price'],
    ['precio no numérico', { price: 'gratis' }, 'price'],
    ['autor sin formato UUID', { authorId: '123' }, 'authorId'],
    ['campo no permitido', { deletedAt: '2020-01-01' }, 'deletedAt'],
  ])('rechaza %s', async (_label, override, field) => {
    const { fields } = await check(CreateBookDTO, { ...valid, ...override });
    expect(fields).toContain(field);
  });
});

describe('UpdateBookDTO', () => {
  it('todos los campos son opcionales', async () => {
    expect((await check(UpdateBookDTO, {})).errors).toHaveLength(0);
    expect((await check(UpdateBookDTO, { price: '5' })).errors).toHaveLength(0);
  });

  it('acepta removeImage y sigue validando lo que viene', async () => {
    const ok = await check(UpdateBookDTO, { removeImage: 'true' });
    expect(ok.instance.removeImage).toBe(true);

    expect((await check(UpdateBookDTO, { price: '-5' })).fields).toContain('price');
  });

  it('expectedUpdatedAt acepta una fecha ISO y rechaza otro texto', async () => {
    const ok = await check(UpdateBookDTO, { expectedUpdatedAt: '2026-01-02T10:00:00.000Z' });
    expect(ok.errors).toHaveLength(0);

    expect((await check(UpdateBookDTO, { expectedUpdatedAt: 'ayer' })).fields).toContain(
      'expectedUpdatedAt',
    );
  });
});

describe('BookResponseDTO.from', () => {
  it('copia los datos del libro sin exponer campos internos', () => {
    const dto = BookResponseDTO.from(makeBook({ imageUrl: 'https://img/x.webp' }));

    expect(dto).toMatchObject({
      id: 'b-1',
      title: 'Cien años de soledad',
      price: 12990.5,
      imageUrl: 'https://img/x.webp',
      author: { id: 'a-1', name: 'Gabriel García Márquez' },
      genre: { id: 'g-1', name: 'Novela' },
    });
    expect(dto).not.toHaveProperty('deletedAt');
  });
});
