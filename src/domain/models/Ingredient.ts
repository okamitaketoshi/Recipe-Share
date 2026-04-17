export class Ingredient {
  private readonly value: string;

  private constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('Ingredient cannot be empty');
    }
    if (trimmed.length > 200) {
      throw new Error('Ingredient must be 200 characters or less');
    }
    this.value = trimmed;
  }

  static create(value: string): Ingredient {
    return new Ingredient(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Ingredient): boolean {
    return this.value === other.value;
  }
}
