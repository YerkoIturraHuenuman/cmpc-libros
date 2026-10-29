# cmpc-back

API REST de CMPC-Libros: NestJS 12, Prisma 7 y PostgreSQL, con arquitectura hexagonal por módulos.

La instalación, la arquitectura, las decisiones de diseño y la referencia de la API están en el [README de la raíz](../README.md). Swagger queda en <http://localhost:3001/docs> con la API arriba.

| Comando | Qué hace |
| --- | --- |
| `npm run start:dev` | API con recarga automática |
| `npm run build` / `npm run start:prod` | Compila y ejecuta `dist/main` |
| `npm test` / `npm run test:cov` | Tests unitarios, con o sin cobertura |
| `npx prisma migrate deploy` / `npx prisma db seed` | Aplica las migraciones y siembra datos |

Necesita un `.env` (ver `.env.example`).
