import { RecipeDTO } from '../dto/RecipeDTO';
import { Recipe } from '../../domain/models/Recipe';
import { RecipeId } from '../../domain/models/RecipeId';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';

/**
 * DTO ⇔ ドメインモデル変換ユーティリティ
 * 将来的にドメインモデルを使用する際に使用
 */
export class RecipeMapper {
  /**
   * DTO → ドメインモデル変換
   */
  static toDomain(dto: RecipeDTO): Recipe {
    const id = RecipeId.create(dto.id);
    const ingredients = dto.ingredients.map((i) => Ingredient.create(i));
    const steps = dto.steps_array.map((s, index) => CookingStep.create(index + 1, s));

    return Recipe.reconstruct(
      id,
      dto.title,
      ingredients,
      steps,
      dto.recipe_url,
      new Date(dto.created_at)
    );
  }

  /**
   * ドメインモデル → DTO変換
   */
  static toDTO(recipe: Recipe): Omit<RecipeDTO, 'id' | 'created_at'> {
    const ingredients = recipe.getIngredients().map((i) => i.getValue());
    const steps = recipe.getSteps().map((s) => s.getDescription());

    return {
      title: recipe.getTitle(),
      ingredients,
      steps_array: steps, // stepsカラム削除に伴い、steps_arrayのみ使用
      recipe_url: recipe.getRecipeUrl(),
    };
  }
}
