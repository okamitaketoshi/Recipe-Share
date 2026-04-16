export class RecipeId {
  private readonly value: string;

  private constructor(value: string) {
    if (!this.isValidUUID(value)) {
      throw new Error('Invalid RecipeId: must be a valid UUID');
    }
    this.value = value;
  }

  static create(value: string): RecipeId {
    return new RecipeId(value);
  }

  static generate(): RecipeId {
    return new RecipeId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RecipeId): boolean {
    return this.value === other.value;
  }

  private isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
