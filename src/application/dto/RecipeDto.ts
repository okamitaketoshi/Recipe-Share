import { Recipe } from '../../domain/models/Recipe';

export interface RecipeDto {
  id: string;
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
}

export function toRecipeDto(recipe: Recipe): RecipeDto {
  return {
    id: recipe.getId().getValue(),
    title: recipe.getTitle(),
    ingredients: recipe.getIngredients().map((i) => i.getValue()),
    steps_array: recipe.getSteps().map((s) => s.getDescription()),
    recipe_url: recipe.getRecipeUrl(),
    created_at: recipe.getCreatedAt().toISOString(),
  };
}
