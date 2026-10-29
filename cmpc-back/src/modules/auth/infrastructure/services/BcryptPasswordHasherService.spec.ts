import { BcryptPasswordHasherService } from './BcryptPasswordHasherService';

describe('BcryptPasswordHasherService', () => {
  const hasher = new BcryptPasswordHasherService();

  it('genera un hash distinto del texto y lo verifica', async () => {
    const hash = await hasher.hash('Secreta123!');

    expect(hash).not.toContain('Secreta123!');
    expect(await hasher.compare('Secreta123!', hash)).toBe(true);
    expect(await hasher.compare('otra', hash)).toBe(false);
  });

  it('usa sal distinta en cada hash', async () => {
    expect(await hasher.hash('igual')).not.toBe(await hasher.hash('igual'));
  });
});
