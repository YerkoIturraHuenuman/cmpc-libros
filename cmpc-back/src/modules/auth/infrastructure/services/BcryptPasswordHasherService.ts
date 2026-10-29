import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import type { PasswordHasherPort } from '../../domain/ports/PasswordHasherPort';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasherPort {
  hash(plain: string): Promise<string> {
    return hash(plain, SALT_ROUNDS);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
