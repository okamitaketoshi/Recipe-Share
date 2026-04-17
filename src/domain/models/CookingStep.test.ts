import { describe, it, expect } from 'vitest';
import { CookingStep } from './CookingStep';

describe('CookingStep', () => {
  describe('create', () => {
    it('should create CookingStep with valid values', () => {
      const step = CookingStep.create(1, 'Chop vegetables');
      expect(step.getStepNumber()).toBe(1);
      expect(step.getDescription()).toBe('Chop vegetables');
    });

    it('should trim description whitespace', () => {
      const step = CookingStep.create(1, '  Chop vegetables  ');
      expect(step.getDescription()).toBe('Chop vegetables');
    });

    it('should throw error with step number 0', () => {
      expect(() => CookingStep.create(0, 'Description')).toThrow(
        'Step number must be 1 or greater'
      );
    });

    it('should throw error with negative step number', () => {
      expect(() => CookingStep.create(-1, 'Description')).toThrow(
        'Step number must be 1 or greater'
      );
    });

    it('should throw error with empty description', () => {
      expect(() => CookingStep.create(1, '')).toThrow('Step description cannot be empty');
    });

    it('should throw error with only whitespace description', () => {
      expect(() => CookingStep.create(1, '   ')).toThrow('Step description cannot be empty');
    });

    it('should throw error when description exceeds max length', () => {
      const longDescription = 'a'.repeat(1001);
      expect(() => CookingStep.create(1, longDescription)).toThrow(
        'Step description must be 1000 characters or less'
      );
    });

    it('should accept description with exactly 1000 characters', () => {
      const description1000 = 'a'.repeat(1000);
      const step = CookingStep.create(1, description1000);
      expect(step.getDescription().length).toBe(1000);
    });
  });

  describe('equals', () => {
    it('should return true for same step number and description', () => {
      const step1 = CookingStep.create(1, 'Chop vegetables');
      const step2 = CookingStep.create(1, 'Chop vegetables');
      expect(step1.equals(step2)).toBe(true);
    });

    it('should return false for different step numbers', () => {
      const step1 = CookingStep.create(1, 'Chop vegetables');
      const step2 = CookingStep.create(2, 'Chop vegetables');
      expect(step1.equals(step2)).toBe(false);
    });

    it('should return false for different descriptions', () => {
      const step1 = CookingStep.create(1, 'Chop vegetables');
      const step2 = CookingStep.create(1, 'Cook vegetables');
      expect(step1.equals(step2)).toBe(false);
    });

    it('should compare trimmed descriptions', () => {
      const step1 = CookingStep.create(1, '  Chop vegetables  ');
      const step2 = CookingStep.create(1, 'Chop vegetables');
      expect(step1.equals(step2)).toBe(true);
    });
  });
});
