import { describe, it, expect } from 'vitest';
import { Recipe } from './Recipe';
import { RecipeId } from './RecipeId';
import { Ingredient } from './Ingredient';
import { CookingStep } from './CookingStep';

describe('Recipe', () => {
  const createTestIngredients = (): Ingredient[] => [
    Ingredient.create('Tomato'),
    Ingredient.create('Onion'),
  ];

  const createTestSteps = (): CookingStep[] => [
    CookingStep.create(1, 'Chop vegetables'),
    CookingStep.create(2, 'Cook in pan'),
  ];

  describe('create', () => {
    it('should create Recipe with valid values', () => {
      const recipe = Recipe.create(
        'Test Recipe',
        createTestIngredients(),
        createTestSteps(),
        'https://example.com/recipe'
      );

      expect(recipe.getTitle()).toBe('Test Recipe');
      expect(recipe.getIngredients()).toHaveLength(2);
      expect(recipe.getSteps()).toHaveLength(2);
      expect(recipe.getRecipeUrl()).toBe('https://example.com/recipe');
    });

    it('should create Recipe without URL', () => {
      const recipe = Recipe.create('Test Recipe', createTestIngredients(), createTestSteps());

      expect(recipe.getRecipeUrl()).toBeNull();
    });

    it('should throw error with empty title', () => {
      expect(() => Recipe.create('', createTestIngredients(), createTestSteps())).toThrow(
        'Title cannot be empty'
      );
    });

    it('should throw error with title exceeding max length', () => {
      const longTitle = 'a'.repeat(101);
      expect(() => Recipe.create(longTitle, createTestIngredients(), createTestSteps())).toThrow(
        'Title must be 100 characters or less'
      );
    });

    it('should throw error with empty ingredients', () => {
      expect(() => Recipe.create('Test Recipe', [], createTestSteps())).toThrow(
        'Recipe must have at least one ingredient'
      );
    });

    it('should throw error with empty steps', () => {
      expect(() => Recipe.create('Test Recipe', createTestIngredients(), [])).toThrow(
        'Recipe must have at least one step'
      );
    });

    it('should throw error with invalid URL', () => {
      expect(() =>
        Recipe.create('Test Recipe', createTestIngredients(), createTestSteps(), 'invalid-url')
      ).toThrow('Invalid recipe URL');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct Recipe from existing data', () => {
      const id = RecipeId.generate();
      const createdAt = new Date('2024-01-01');

      const recipe = Recipe.reconstruct(
        id,
        'Test Recipe',
        createTestIngredients(),
        createTestSteps(),
        'https://example.com/recipe',
        createdAt
      );

      expect(recipe.getId().equals(id)).toBe(true);
      expect(recipe.getTitle()).toBe('Test Recipe');
      expect(recipe.getCreatedAt()).toBe(createdAt);
    });
  });

  describe('addIngredient', () => {
    it('should add new ingredient', () => {
      const recipe = Recipe.create('Test Recipe', createTestIngredients(), createTestSteps());

      const newIngredient = Ingredient.create('Garlic');
      recipe.addIngredient(newIngredient);

      expect(recipe.getIngredients()).toHaveLength(3);
      expect(recipe.getIngredients().some((i) => i.equals(newIngredient))).toBe(true);
    });

    it('should throw error when adding duplicate ingredient', () => {
      const recipe = Recipe.create('Test Recipe', createTestIngredients(), createTestSteps());

      const duplicateIngredient = Ingredient.create('Tomato');
      expect(() => recipe.addIngredient(duplicateIngredient)).toThrow('Ingredient already exists');
    });
  });

  describe('removeIngredient', () => {
    it('should remove existing ingredient', () => {
      const recipe = Recipe.create('Test Recipe', createTestIngredients(), createTestSteps());

      const ingredientToRemove = Ingredient.create('Tomato');
      recipe.removeIngredient(ingredientToRemove);

      expect(recipe.getIngredients()).toHaveLength(1);
      expect(recipe.getIngredients().some((i) => i.equals(ingredientToRemove))).toBe(false);
    });

    it('should throw error when removing non-existent ingredient', () => {
      const recipe = Recipe.create('Test Recipe', createTestIngredients(), createTestSteps());

      const nonExistentIngredient = Ingredient.create('Garlic');
      expect(() => recipe.removeIngredient(nonExistentIngredient)).toThrow('Ingredient not found');
    });
  });

  describe('updateStep', () => {
    it('should update existing step', () => {
      const recipe = Recipe.create('Test Recipe', createTestIngredients(), createTestSteps());

      recipe.updateStep(1, 'Dice vegetables');

      const steps = recipe.getSteps();
      expect(steps[0].getDescription()).toBe('Dice vegetables');
    });

    it('should throw error when updating non-existent step', () => {
      const recipe = Recipe.create('Test Recipe', createTestIngredients(), createTestSteps());

      expect(() => recipe.updateStep(99, 'New description')).toThrow('Step not found');
    });
  });

  describe('isComplete', () => {
    it('should return true for complete recipe', () => {
      const recipe = Recipe.create('Test Recipe', createTestIngredients(), createTestSteps());

      expect(recipe.isComplete()).toBe(true);
    });

    // Note: タイトルが空のRecipeは作成できないため、
    // isComplete()は常にtrueを返す（バリデーションで保証）
  });
});
