import { RecipeId } from './RecipeId';
import { Ingredient } from './Ingredient';
import { CookingStep } from './CookingStep';

export class Recipe {
  private readonly id: RecipeId;
  private title: string;
  private ingredients: Ingredient[];
  private steps: CookingStep[];
  private recipeUrl: string | null;
  private readonly createdAt: Date;

  private constructor(
    id: RecipeId,
    title: string,
    ingredients: Ingredient[],
    steps: CookingStep[],
    recipeUrl: string | null,
    createdAt: Date
  ) {
    this.validateTitle(title);
    this.validateIngredients(ingredients);
    this.validateSteps(steps);
    this.validateRecipeUrl(recipeUrl);

    this.id = id;
    this.title = title;
    this.ingredients = ingredients;
    this.steps = steps;
    this.recipeUrl = recipeUrl;
    this.createdAt = createdAt;
  }

  static create(
    title: string,
    ingredients: Ingredient[],
    steps: CookingStep[],
    recipeUrl: string | null = null
  ): Recipe {
    return new Recipe(RecipeId.generate(), title, ingredients, steps, recipeUrl, new Date());
  }

  static reconstruct(
    id: RecipeId,
    title: string,
    ingredients: Ingredient[],
    steps: CookingStep[],
    recipeUrl: string | null,
    createdAt: Date
  ): Recipe {
    return new Recipe(id, title, ingredients, steps, recipeUrl, createdAt);
  }

  addIngredient(ingredient: Ingredient): void {
    if (this.ingredients.some((i) => i.equals(ingredient))) {
      throw new Error('Ingredient already exists');
    }
    this.ingredients.push(ingredient);
  }

  removeIngredient(ingredient: Ingredient): void {
    const index = this.ingredients.findIndex((i) => i.equals(ingredient));
    if (index === -1) {
      throw new Error('Ingredient not found');
    }
    this.ingredients.splice(index, 1);
  }

  updateStep(stepNumber: number, description: string): void {
    const index = this.steps.findIndex((s) => s.getStepNumber() === stepNumber);
    if (index === -1) {
      throw new Error('Step not found');
    }
    this.steps[index] = CookingStep.create(stepNumber, description);
  }

  isComplete(): boolean {
    return this.title.trim().length > 0 && this.ingredients.length > 0 && this.steps.length > 0;
  }

  private validateTitle(title: string): void {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (trimmed.length > 100) {
      throw new Error('Title must be 100 characters or less');
    }
  }

  private validateIngredients(ingredients: Ingredient[]): void {
    if (ingredients.length === 0) {
      throw new Error('Recipe must have at least one ingredient');
    }
  }

  private validateSteps(steps: CookingStep[]): void {
    if (steps.length === 0) {
      throw new Error('Recipe must have at least one step');
    }
  }

  private validateRecipeUrl(recipeUrl: string | null): void {
    if (recipeUrl === null) return;
    try {
      new URL(recipeUrl);
    } catch {
      throw new Error('Invalid recipe URL');
    }
  }

  getId(): RecipeId {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getIngredients(): ReadonlyArray<Ingredient> {
    return this.ingredients;
  }

  getSteps(): ReadonlyArray<CookingStep> {
    return this.steps;
  }

  getRecipeUrl(): string | null {
    return this.recipeUrl;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
