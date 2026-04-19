import { RecipeRow } from '../supabase/schema';
import { Recipe } from '../../domain/models/Recipe';
import { RecipeId } from '../../domain/models/RecipeId';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';

/**
 * RecipeRow ⇔ Recipe（ドメインモデル）変換
 */
export class RecipeMapper {
  /**
   * RecipeRow → Recipe（ドメインモデル）変換
   */
  static toDomain(row: RecipeRow): Recipe {
    const id = RecipeId.create(row.id);
    const ingredients = row.ingredients.map((i) => Ingredient.create(i));
    const steps = row.steps_array.map((s, index) => CookingStep.create(index + 1, s));

    return Recipe.reconstruct(
      id,
      row.title,
      ingredients,
      steps,
      row.recipe_url,
      new Date(row.created_at)
    );
  }

  /**
   * Recipe（ドメインモデル）→ RecipeRow変換
   */
  static toRow(recipe: Recipe): Omit<RecipeRow, 'id' | 'created_at'> {
    const ingredients = recipe.getIngredients().map((i) => i.getValue());
    const steps = recipe.getSteps().map((s) => s.getDescription());

    return {
      title: recipe.getTitle(),
      ingredients,
      steps_array: steps,
      recipe_url: recipe.getRecipeUrl(),
    };
  }
}
