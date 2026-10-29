import type { TransformFnParams } from 'class-transformer';
import { toBoolean, toList, trim } from './transforms';

const p = (value: unknown) => ({ value }) as TransformFnParams;

describe('transforms', () => {
  describe('trim', () => {
    it('recorta strings y deja el resto igual', () => {
      expect(trim(p('  hola '))).toBe('hola');
      expect(trim(p(5))).toBe(5);
      expect(trim(p(undefined))).toBeUndefined();
    });
  });

  describe('toBoolean', () => {
    it('convierte "true" y "false"', () => {
      expect(toBoolean(p('true'))).toBe(true);
      expect(toBoolean(p('false'))).toBe(false);
    });

    it('deja pasar cualquier otro valor para que la validación lo rechace', () => {
      expect(toBoolean(p('si'))).toBe('si');
      expect(toBoolean(p(true))).toBe(true);
    });
  });

  describe('toList', () => {
    it('separa por coma y descarta vacíos', () => {
      expect(toList(p('a, b ,,c'))).toEqual(['a', 'b', 'c']);
    });

    it('acepta parámetros repetidos', () => {
      expect(toList(p(['a', 'b,c']))).toEqual(['a', 'b', 'c']);
    });

    it('devuelve undefined si no hay valor', () => {
      expect(toList(p(undefined))).toBeUndefined();
      expect(toList(p(null))).toBeUndefined();
      expect(toList(p(''))).toBeUndefined();
    });
  });
});
