import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../../src/common/database/prisma/generated/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const GENRES = ['Novela', 'Ciencia ficción', 'Fantasía', 'Historia', 'Poesía', 'Ensayo'];
const PUBLISHERS = ['Penguin Random House', 'Planeta', 'Alfaguara', 'Anagrama', 'Zig-Zag'];
const AUTHORS = [
  'Gabriel García Márquez',
  'Isabel Allende',
  'Roberto Bolaño',
  'Gabriela Mistral',
  'Pablo Neruda',
  'Julio Cortázar',
  'Jorge Luis Borges',
  'Ursula K. Le Guin',
];

async function main(): Promise<void> {
  const email = 'admin@cmpc.test';
  const password = 'Asd123.';

  const admin = {
    name: 'Administrador',
    role: 'ADMIN' as const,
    passwordHash: await hash(password, 12),
  };
  await prisma.user.upsert({
    where: { email },
    update: admin,
    create: { email, ...admin },
  });

  const genres = await Promise.all(
    GENRES.map((name) =>
      prisma.genre.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const publishers = await Promise.all(
    PUBLISHERS.map((name) =>
      prisma.publisher.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const authors = await Promise.all(
    AUTHORS.map((name) =>
      prisma.author.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  for (let i = 0; i < 30; i += 1) {
    const title = `Libro de ejemplo ${String(i + 1).padStart(2, '0')}`;
    const existing = await prisma.book.findFirst({ where: { title } });

    if (!existing) {
      await prisma.book.create({
        data: {
          title,
          price: 5990 + i * 1000,
          isAvailable: i % 4 !== 0,
          authorId: authors[i % authors.length].id,
          publisherId: publishers[i % publishers.length].id,
          genreId: genres[i % genres.length].id,
        },
      });
    } else if (existing.deletedAt) {
      await prisma.book.update({ where: { id: existing.id }, data: { deletedAt: null } });
    }
  }

  console.log(`Seed listo. Usuario admin: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
