import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'migrations/prisma/schema.prisma',
  migrations: {
    path: 'migrations/prisma/migrations',
    seed: 'tsx migrations/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
