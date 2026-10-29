import { catalogSchema } from './catalogSchema';

const error = (name: string) => {
  const result = catalogSchema.safeParse({ name });
  return result.success ? null : result.error.issues[0].message;
};

describe('catalogSchema', () => {
  it('acepta un nombre y lo recorta', () => {
    expect(catalogSchema.parse({ name: '  Borges ' })).toEqual({ name: 'Borges' });
  });

  it.each(['', '   '])('rechaza un nombre vacío (%p)', (name) => {
    expect(error(name)).toBe('Escribe un nombre');
  });

  it('limita el nombre a 120 caracteres', () => {
    expect(error('a'.repeat(121))).toBe('Máximo 120 caracteres');
    expect(error('a'.repeat(120))).toBeNull();
  });
});
