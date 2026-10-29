import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './AllExceptionsFilter';

function setup(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status, getHeader: () => 'req-id-1234' }),
      getRequest: () => ({ method: 'GET', originalUrl: '/books/1' }),
    }),
  } as unknown as ArgumentsHost;

  new AllExceptionsFilter().catch(exception, host);

  return { status, body: json.mock.calls[0][0] as Record<string, unknown> };
}

const prismaError = (code: string) =>
  Object.assign(new Error('db'), { name: 'PrismaClientKnownRequestError', code });

describe('AllExceptionsFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('incluye el id de la petición para poder rastrear el error', () => {
    const { body } = setup(new NotFoundException('x'));
    expect(body.requestId).toBe('req-id-1234');
  });

  it('mantiene status y mensaje de una HttpException', () => {
    const { status, body } = setup(new NotFoundException('Libro no encontrado'));

    expect(status).toHaveBeenCalledWith(404);
    expect(body).toMatchObject({
      success: false,
      statusCode: 404,
      message: 'Libro no encontrado',
      path: '/books/1',
    });
  });

  it('conserva la lista de errores de validación', () => {
    const { body } = setup(new BadRequestException(['title vacío', 'price < 0']));
    expect(body.message).toEqual(['title vacío', 'price < 0']);
  });

  it('si el cuerpo no trae error ni mensaje, usa los de la excepción', () => {
    const { body } = setup(new HttpException({ code: 'CUSTOM' }, 422));

    expect(body).toMatchObject({
      statusCode: 422,
      error: 'HttpException',
      message: 'Http Exception',
    });
  });

  it('acepta HttpException con cuerpo string', () => {
    const { body } = setup(new HttpException('plano', 418));
    expect(body).toMatchObject({ statusCode: 418, message: 'plano' });
  });

  it.each([
    ['P2002', 409],
    ['P2025', 404],
    ['P2003', 400],
  ])('traduce el error Prisma %s a %d', (code, expected) => {
    const { status } = setup(prismaError(code));
    expect(status).toHaveBeenCalledWith(expected);
  });

  it('trata un código Prisma desconocido como 500', () => {
    const { status } = setup(prismaError('P9999'));
    expect(status).toHaveBeenCalledWith(500);
  });

  it('no filtra detalles de errores inesperados', () => {
    const { status, body } = setup(new Error('password=secreto en la query'));

    expect(status).toHaveBeenCalledWith(500);
    expect(body.message).toBe('Ocurrió un error inesperado');
    expect(JSON.stringify(body)).not.toContain('secreto');
  });

  it('maneja valores que no son Error', () => {
    const { status } = setup('boom');
    expect(status).toHaveBeenCalledWith(500);
  });
});
