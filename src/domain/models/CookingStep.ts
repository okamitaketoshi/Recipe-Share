export class CookingStep {
  private readonly stepNumber: number;
  private readonly description: string;

  private constructor(stepNumber: number, description: string) {
    if (stepNumber < 1) {
      throw new Error('Step number must be 1 or greater');
    }
    const trimmed = description.trim();
    if (trimmed.length === 0) {
      throw new Error('Step description cannot be empty');
    }
    if (trimmed.length > 1000) {
      throw new Error('Step description must be 1000 characters or less');
    }
    this.stepNumber = stepNumber;
    this.description = trimmed;
  }

  static create(stepNumber: number, description: string): CookingStep {
    return new CookingStep(stepNumber, description);
  }

  getStepNumber(): number {
    return this.stepNumber;
  }

  getDescription(): string {
    return this.description;
  }

  equals(other: CookingStep): boolean {
    return this.stepNumber === other.stepNumber && this.description === other.description;
  }
}
