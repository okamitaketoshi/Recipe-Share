import { Recipe } from '../../domain/models/Recipe';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import { CreateRecipeRequest } from '../dto/CreateRecipeRequest';
import { RecipeDto, toRecipeDto } from '../dto/RecipeDto';

export class CreateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(request: CreateRecipeRequest): Promise<RecipeDto> {
    // Value Object を生成（バリデーションはドメインモデルが実行）
    const ingredients = request.ingredients.map((i) => Ingredient.create(i));
    const steps = request.steps_array.map((s, idx) => CookingStep.create(idx + 1, s));

    // ドメインモデル生成（バリデーションはRecipe.create内で実行）
    const recipe = Recipe.create(request.title, ingredients, steps, request.recipe_url);

    // リポジトリ経由で保存
    const savedRecipe = await this.recipeRepository.create(recipe);

    // DTOに変換して返す
    return toRecipeDto(savedRecipe);
  }
}
