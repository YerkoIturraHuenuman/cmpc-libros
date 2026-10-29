export class PaginatedResult<T> {
  constructor(
    readonly items: T[],
    readonly total: number,
    readonly page: number,
    readonly limit: number,
  ) {}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }
}
