import { describe, it, expect } from 'vitest';
import { Ingredient } from './Ingredient';

describe('Ingredient', () => {
  describe('create', () => {
    it('should create Ingredient with valid value', () => {
      const ingredient = Ingredient.create('Tomato');
      expect(ingredient.getValue()).toBe('Tomato');
    });

    it('should trim whitespace', () => {
      const ingredient = Ingredient.create('  Tomato  ');
      expect(ingredient.getValue()).toBe('Tomato');
    });

    it('should throw error with empty string', () => {
      expect(() => Ingredient.create('')).toThrow('Ingredient cannot be empty');
    });

    it('should throw error with only whitespace', () => {
      expect(() => Ingredient.create('   ')).toThrow('Ingredient cannot be empty');
    });

    it('should throw error when exceeding max length', () => {
      const longIngredient = 'a'.repeat(201);
      expect(() => Ingredient.create(longIngredient)).toThrow(
        'Ingredient must be 200 characters or less'
      );
    });

    it('should accept ingredient with exactly 200 characters', () => {
      const ingredient200 = 'a'.repeat(200);
      const ingredient = Ingredient.create(ingredient200);
      expect(ingredient.getValue().length).toBe(200);
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const ingredient1 = Ingredient.create('Tomato');
      const ingredient2 = Ingredient.create('Tomato');
      expect(ingredient1.equals(ingredient2)).toBe(true);
    });

    it('should return false for different values', () => {
      const ingredient1 = Ingredient.create('Tomato');
      const ingredient2 = Ingredient.create('Onion');
      expect(ingredient1.equals(ingredient2)).toBe(false);
    });

    it('should compare trimmed values', () => {
      const ingredient1 = Ingredient.create('  Tomato  ');
      const ingredient2 = Ingredient.create('Tomato');
      expect(ingredient1.equals(ingredient2)).toBe(true);
    });
  });
});
