import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { PaginatedResult } from '@/common/dto/PaginatedResponseDTO';
import { Audit } from '@/modules/audit/infrastructure/interceptors/Audit';
import { BookResponseDTO } from '../../application/dto/BookResponseDTO';
import { CreateBookDTO } from '../../application/dto/CreateBookDTO';
import {
  ExportBooksQueryDTO,
  ListBooksQueryDTO,
} from '../../application/dto/ListBooksQueryDTO';
import { UpdateBookDTO } from '../../application/dto/UpdateBookDTO';
import { CreateBook } from '../../application/use-cases/CreateBook';
import { DeleteBook } from '../../application/use-cases/DeleteBook';
import { ExportBooksCsv } from '../../application/use-cases/ExportBooksCsv';
import { GetBookById } from '../../application/use-cases/GetBookById';
import { ListBooks } from '../../application/use-cases/ListBooks';
import { UpdateBook } from '../../application/use-cases/UpdateBook';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const imageUpload = FileInterceptor('image', {
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
});

const MULTIPART_BODY = {
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      price: { type: 'number' },
      isAvailable: { type: 'boolean' },
      authorId: { type: 'string', format: 'uuid' },
      publisherId: { type: 'string', format: 'uuid' },
      genreId: { type: 'string', format: 'uuid' },
      removeImage: { type: 'boolean' },
      image: {
        type: 'string',
        format: 'binary',
        description: 'Portada: JPEG, PNG o WebP, máximo 5 MB',
      },
    },
  },
};

@ApiTags('books')
@ApiBearerAuth()
@ApiCookieAuth('access_token')
@Controller('books')
export class BooksController {
  constructor(
    private readonly listBooks: ListBooks,
    private readonly exportBooks: ExportBooksCsv,
    private readonly getBook: GetBookById,
    private readonly createBook: CreateBook,
    private readonly updateBook: UpdateBook,
    private readonly deleteBook: DeleteBook,
  ) {}

  @Get()
  @ApiOkResponse({ type: [BookResponseDTO] })
  list(
    @Query() query: ListBooksQueryDTO,
  ): Promise<PaginatedResult<BookResponseDTO>> {
    return this.listBooks.execute(query);
  }

  @Get('export')
  @Audit({ action: 'EXPORT', entity: 'Book' })
  @ApiProduces('text/csv')
  @ApiOkResponse({ description: 'Archivo CSV con los libros filtrados' })
  async export(
    @Query() query: ExportBooksQueryDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const csv = await this.exportBooks.execute(query);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="libros.csv"',
    });
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }

  @Get(':id')
  @ApiOkResponse({ type: BookResponseDTO })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<BookResponseDTO> {
    return this.getBook.execute(id);
  }

  @Post()
  @UseInterceptors(imageUpload)
  @Audit({ action: 'CREATE', entity: 'Book' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(MULTIPART_BODY)
  @ApiCreatedResponse({ type: BookResponseDTO })
  create(
    @Body() dto: CreateBookDTO,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<BookResponseDTO> {
    return this.createBook.execute(dto, image?.buffer);
  }

  @Patch(':id')
  @UseInterceptors(imageUpload)
  @Audit({ action: 'UPDATE', entity: 'Book' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(MULTIPART_BODY)
  @ApiOkResponse({ type: BookResponseDTO })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookDTO,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<BookResponseDTO> {
    return this.updateBook.execute(id, dto, image?.buffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit({ action: 'DELETE', entity: 'Book' })
  @ApiNoContentResponse({ description: 'Libro eliminado (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteBook.execute(id);
  }
}
