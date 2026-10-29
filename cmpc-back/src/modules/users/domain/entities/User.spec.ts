import { User } from './User';

const make = (role: 'ADMIN' | 'USER') =>
  new User('1', 'a@b.cl', 'Ana', role, 'hash', new Date());

describe('User', () => {
  it('isAdmin solo es true para ADMIN', () => {
    expect(make('ADMIN').isAdmin()).toBe(true);
    expect(make('USER').isAdmin()).toBe(false);
  });
});
