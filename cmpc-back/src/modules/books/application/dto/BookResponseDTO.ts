import { ApiProperty } from '@nestjs/swagger';
import type { Book } from '../../domain/entities/Book';

export class BookRelationDTO {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class BookResponseDTO {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ example: 12990.5 }) price: number;
  @ApiProperty() isAvailable: boolean;
  @ApiProperty({ nullable: true, type: String }) imageUrl: string | null;
  @ApiProperty({ type: BookRelationDTO }) author: BookRelationDTO;
  @ApiProperty({ type: BookRelationDTO }) publisher: BookRelationDTO;
  @ApiProperty({ type: BookRelationDTO }) genre: BookRelationDTO;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static from(book: Book): BookResponseDTO {
    const dto = new BookResponseDTO();
    dto.id = book.id;
    dto.title = book.title;
    dto.price = book.price;
    dto.isAvailable = book.isAvailable;
    dto.imageUrl = book.imageUrl;
    dto.author = { id: book.author.id, name: book.author.name };
    dto.publisher = { id: book.publisher.id, name: book.publisher.name };
    dto.genre = { id: book.genre.id, name: book.genre.name };
    dto.createdAt = book.createdAt;
    dto.updatedAt = book.updatedAt;
    return dto;
  }
}
