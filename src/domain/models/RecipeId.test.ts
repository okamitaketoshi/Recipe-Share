import { describe, it, expect } from 'vitest';
import { RecipeId } from './RecipeId';

describe('RecipeId', () => {
  describe('create', () => {
    it('should create RecipeId with valid UUID v4', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const recipeId = RecipeId.create(validUUID);
      expect(recipeId.getValue()).toBe(validUUID);
    });

    it('should throw error with invalid UUID', () => {
      const invalidUUID = 'invalid-uuid';
      expect(() => RecipeId.create(invalidUUID)).toThrow('Invalid RecipeId: must be a valid UUID');
    });

    it('should throw error with empty string', () => {
      expect(() => RecipeId.create('')).toThrow('Invalid RecipeId: must be a valid UUID');
    });

    it('should throw error with non-v4 UUID', () => {
      const nonV4UUID = '550e8400-e29b-11d4-a716-446655440000'; // v1 UUID
      expect(() => RecipeId.create(nonV4UUID)).toThrow('Invalid RecipeId: must be a valid UUID');
    });
  });

  describe('generate', () => {
    it('should generate valid UUID v4', () => {
      const recipeId = RecipeId.generate();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(recipeId.getValue())).toBe(true);
    });

    it('should generate different UUIDs', () => {
      const recipeId1 = RecipeId.generate();
      const recipeId2 = RecipeId.generate();
      expect(recipeId1.getValue()).not.toBe(recipeId2.getValue());
    });
  });

  describe('equals', () => {
    it('should return true for same UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const recipeId1 = RecipeId.create(uuid);
      const recipeId2 = RecipeId.create(uuid);
      expect(recipeId1.equals(recipeId2)).toBe(true);
    });

    it('should return false for different UUIDs', () => {
      const recipeId1 = RecipeId.create('550e8400-e29b-41d4-a716-446655440000');
      const recipeId2 = RecipeId.create('660e8400-e29b-41d4-a716-446655440000');
      expect(recipeId1.equals(recipeId2)).toBe(false);
    });
  });
});
