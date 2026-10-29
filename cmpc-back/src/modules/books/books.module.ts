import { Module } from '@nestjs/common';
import {
  BOOK_REPOSITORY,
  CSV_EXPORTER,
  FILE_STORAGE,
  IMAGE_SANITIZER,
} from '@/common/config/di-tokens';
import { CatalogModule } from '../catalog/catalog.module';
import { CreateBook } from './application/use-cases/CreateBook';
import { DeleteBook } from './application/use-cases/DeleteBook';
import { EnsureCatalogReferences } from './application/use-cases/EnsureCatalogReferences';
import { ExportBooksCsv } from './application/use-cases/ExportBooksCsv';
import { GetBookById } from './application/use-cases/GetBookById';
import { ListBooks } from './application/use-cases/ListBooks';
import { UpdateBook } from './application/use-cases/UpdateBook';
import { UploadBookImage } from './application/use-cases/UploadBookImage';
import { BooksController } from './infrastructure/controllers/BooksController';
import { BookRepositoryPrisma } from './infrastructure/repositories/BookRepositoryPrisma';
import { CloudinaryStorageService } from './infrastructure/services/CloudinaryStorageService';
import { CsvExporterService } from './infrastructure/services/CsvExporterService';
import { SharpImageSanitizerService } from './infrastructure/services/SharpImageSanitizerService';

@Module({
  imports: [CatalogModule],
  controllers: [BooksController],
  providers: [
    ListBooks,
    GetBookById,
    CreateBook,
    UpdateBook,
    DeleteBook,
    ExportBooksCsv,
    UploadBookImage,
    EnsureCatalogReferences,
    { provide: BOOK_REPOSITORY, useClass: BookRepositoryPrisma },
    { provide: FILE_STORAGE, useClass: CloudinaryStorageService },
    { provide: IMAGE_SANITIZER, useClass: SharpImageSanitizerService },
    { provide: CSV_EXPORTER, useClass: CsvExporterService },
  ],
})
export class BooksModule {}
