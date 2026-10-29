import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BOOK_REPOSITORY, FILE_STORAGE } from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import { Book } from '../../domain/entities/Book';
import {
  StaleBookError,
  type BookRepositoryPort,
  type UpdateBookData,
} from '../../domain/ports/BookRepositoryPort';
import type { FileStoragePort } from '../../domain/ports/FileStoragePort';
import { BookResponseDTO } from '../dto/BookResponseDTO';
import type { UpdateBookDTO } from '../dto/UpdateBookDTO';
import { EnsureCatalogReferences } from './EnsureCatalogReferences';
import { UploadBookImage } from './UploadBookImage';

@Injectable()
export class UpdateBook {
  private readonly flow = new FlowLogger(UpdateBook.name);

  constructor(
    @Inject(BOOK_REPOSITORY) private readonly books: BookRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
    private readonly ensureReferences: EnsureCatalogReferences,
    private readonly uploadImage: UploadBookImage,
  ) {}

  execute(
    id: string,
    dto: UpdateBookDTO,
    image?: Buffer,
  ): Promise<BookResponseDTO> {
    return this.flow.track(
      'execute',
      { id, hasImage: Boolean(image), removeImage: dto.removeImage ?? false },
      () => this.update(id, dto, image),
      (book) => ({ id: book.id }),
    );
  }

  private async update(
    id: string,
    dto: UpdateBookDTO,
    image?: Buffer,
  ): Promise<BookResponseDTO> {
    const existing = await this.books.findById(id);
    if (!existing) {
      throw new NotFoundException('Libro no encontrado');
    }

    const violations = Book.validate(dto);
    if (violations.length > 0) {
      throw new BadRequestException(violations);
    }

    await this.ensureReferences.execute(dto);

    const data: UpdateBookData = {
      title: dto.title?.trim(),
      price: dto.price,
      isAvailable: dto.isAvailable,
      authorId: dto.authorId,
      publisherId: dto.publisherId,
      genreId: dto.genreId,
    };

    let newImageUrl: string | undefined;
    if (image) {
      newImageUrl = await this.uploadImage.execute(image);
      data.imageUrl = newImageUrl;
    } else if (dto.removeImage) {
      data.imageUrl = null;
    }

    let updated: Book | null;
    try {
      updated = await this.books.update(
        id,
        data,
        dto.expectedUpdatedAt ? new Date(dto.expectedUpdatedAt) : undefined,
      );
    } catch (error) {
      if (newImageUrl) await this.storage.delete(newImageUrl);
      if (error instanceof StaleBookError) {
        throw new ConflictException(
          'Otra persona modificó este libro mientras lo editabas. Cierra el formulario y vuelve a abrirlo para ver los cambios.',
        );
      }
      throw error;
    }

    if (!updated) {
      if (newImageUrl) await this.storage.delete(newImageUrl);
      throw new NotFoundException('Libro no encontrado');
    }

    if (existing.imageUrl && data.imageUrl !== undefined) {
      await this.storage.delete(existing.imageUrl);
    }

    return BookResponseDTO.from(updated);
  }
}
