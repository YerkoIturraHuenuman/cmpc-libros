DROP INDEX "books_authorId_idx";
DROP INDEX "books_publisherId_idx";
DROP INDEX "books_genreId_idx";
DROP INDEX "books_isAvailable_idx";
DROP INDEX "books_deletedAt_idx";
DROP INDEX "books_title_idx";

CREATE INDEX "books_createdAt_id_idx" ON "books" ("createdAt" DESC, "id" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX "books_genreId_createdAt_id_idx" ON "books" ("genreId", "createdAt" DESC, "id" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX "books_publisherId_createdAt_id_idx" ON "books" ("publisherId", "createdAt" DESC, "id" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX "books_authorId_createdAt_id_idx" ON "books" ("authorId", "createdAt" DESC, "id" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX "books_title_id_idx" ON "books" ("title", "id") WHERE "deletedAt" IS NULL;
CREATE INDEX "books_price_id_idx" ON "books" ("price", "id") WHERE "deletedAt" IS NULL;

CREATE INDEX "authors_name_trgm_idx" ON "authors" USING GIN ("name" gin_trgm_ops);
