export interface BookRelation {
  id: string;
  name: string;
}

export const MAX_PRICE = 99_999_999.99;

export class Book {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly price: number,
    readonly isAvailable: boolean,
    readonly imageUrl: string | null,
    readonly author: BookRelation,
    readonly publisher: BookRelation,
    readonly genre: BookRelation,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static validate(data: { title?: string; price?: number }): string[] {
    const violations: string[] = [];

    if (data.title !== undefined && data.title.trim().length === 0) {
      violations.push('El título no puede estar vacío');
    }
    if (data.price !== undefined) {
      if (!Number.isFinite(data.price) || data.price < 0) {
        violations.push('El precio no puede ser negativo');
      } else if (data.price > MAX_PRICE) {
        violations.push(`El precio no puede superar ${MAX_PRICE}`);
      }
    }

    return violations;
  }
}
