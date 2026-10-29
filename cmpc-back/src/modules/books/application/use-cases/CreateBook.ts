import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BOOK_REPOSITORY, FILE_STORAGE } from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import { Book } from '../../domain/entities/Book';
import type { BookRepositoryPort } from '../../domain/ports/BookRepositoryPort';
import type { FileStoragePort } from '../../domain/ports/FileStoragePort';
import { BookResponseDTO } from '../dto/BookResponseDTO';
import type { CreateBookDTO } from '../dto/CreateBookDTO';
import { EnsureCatalogReferences } from './EnsureCatalogReferences';
import { UploadBookImage } from './UploadBookImage';

@Injectable()
export class CreateBook {
  private readonly flow = new FlowLogger(CreateBook.name);

  constructor(
    @Inject(BOOK_REPOSITORY) private readonly books: BookRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
    private readonly ensureReferences: EnsureCatalogReferences,
    private readonly uploadImage: UploadBookImage,
  ) {}

  execute(dto: CreateBookDTO, image?: Buffer): Promise<BookResponseDTO> {
    return this.flow.track(
      'execute',
      { title: dto.title, authorId: dto.authorId, hasImage: Boolean(image) },
      () => this.create(dto, image),
      (book) => ({ id: book.id }),
    );
  }

  private async create(dto: CreateBookDTO, image?: Buffer): Promise<BookResponseDTO> {
    const violations = Book.validate(dto);
    if (violations.length > 0) {
      throw new BadRequestException(violations);
    }

    await this.ensureReferences.execute(dto);

    const imageUrl = image ? await this.uploadImage.execute(image) : null;

    try {
      const book = await this.books.create({
        title: dto.title.trim(),
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
        imageUrl,
        authorId: dto.authorId,
        publisherId: dto.publisherId,
        genreId: dto.genreId,
      });
      return BookResponseDTO.from(book);
    } catch (error) {
      if (imageUrl) {
        await this.storage.delete(imageUrl);
      }
      throw error;
    }
  }
}
