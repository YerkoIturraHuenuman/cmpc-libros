import { BadRequestException, Logger } from '@nestjs/common';
import { FlowLogger } from './FlowLogger';

describe('FlowLogger', () => {
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  const flow = new FlowLogger('CreateBook');

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('request y response llevan el formato [Clase][metodo][Fase]', () => {
    flow.request('execute', { id: 'b-1' });
    flow.response('execute');

    expect(log).toHaveBeenNthCalledWith(1, '[CreateBook][execute][Request] {"id":"b-1"}');
    expect(log).toHaveBeenNthCalledWith(2, '[CreateBook][execute][Response]');
  });

  it('un error de cliente (4xx) sale como advertencia', () => {
    flow.error('execute', new BadRequestException('Datos inválidos'), { id: 'b-1' });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[CreateBook][execute][Error] {"id":"b-1","message":"Datos inválidos"}'),
    );
    expect(error).not.toHaveBeenCalled();
  });

  it('un error inesperado sale como error con su traza', () => {
    const failure = new Error('boom');

    flow.error('execute', failure);

    expect(error).toHaveBeenCalledWith('[CreateBook][execute][Error] {"message":"boom"}', failure.stack);
  });

  it('acepta valores que no son Error', () => {
    flow.error('execute', 'texto');

    expect(error).toHaveBeenCalledWith('[CreateBook][execute][Error] {"message":"texto"}', undefined);
  });

  it('toma el mensaje de objetos que no son Error, como los del SDK de Cloudinary', () => {
    flow.error('upload', { message: 'Invalid Signature', http_code: 401 });

    expect(error).toHaveBeenCalledWith('[CreateBook][upload][Error] {"message":"Invalid Signature"}', undefined);
  });

  describe('track', () => {
    it('registra entrada y salida y devuelve el resultado', async () => {
      const result = await flow.track(
        'execute',
        { title: 'Rayuela' },
        async () => ({ id: 'b-1' }),
        (book) => ({ id: book.id }),
      );

      expect(result).toEqual({ id: 'b-1' });
      expect(log).toHaveBeenNthCalledWith(1, '[CreateBook][execute][Request] {"title":"Rayuela"}');
      expect(log).toHaveBeenNthCalledWith(2, '[CreateBook][execute][Response] {"id":"b-1"}');
    });

    it('sin resumen registra la respuesta sin datos', async () => {
      await flow.track('execute', undefined, async () => undefined);

      expect(log).toHaveBeenNthCalledWith(1, '[CreateBook][execute][Request]');
      expect(log).toHaveBeenNthCalledWith(2, '[CreateBook][execute][Response]');
    });

    it('registra el error y lo vuelve a lanzar', async () => {
      const failure = new BadRequestException('mal');

      await expect(flow.track('execute', { id: 1 }, async () => Promise.reject(failure))).rejects.toBe(failure);

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[CreateBook][execute][Error]'));
    });
  });
});
