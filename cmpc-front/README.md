# cmpc-front

Aplicación web de CMPC-Libros: Next.js 16, React 19, TypeScript y Tailwind 4, con shadcn/ui y React Bits.

La instalación, la guía de uso, la estructura y las decisiones de diseño están en el [README de la raíz](../README.md).

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en <http://localhost:3000> (la API debe estar arriba) |
| `npm run build` / `npm start` | Compila y sirve la versión de producción |
| `npm test` / `npm run test:cov` | Tests unitarios, con o sin cobertura |
| `npm run lint` | ESLint |

Necesita un `.env.local` con `NEXT_PUBLIC_API_URL` (ver `.env.example`).
