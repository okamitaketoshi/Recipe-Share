import { RecipeId } from '../../domain/models/RecipeId';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';
import { Recipe } from '../../domain/models/Recipe';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import { CreateRecipeRequest } from '../dto/CreateRecipeRequest';
import { RecipeDto, toRecipeDto } from '../dto/RecipeDto';

export class UpdateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(id: string, request: CreateRecipeRequest): Promise<RecipeDto> {
    // RecipeId を生成
    const recipeId = RecipeId.create(id);

    // 存在確認
    const existingRecipe = await this.recipeRepository.findById(recipeId);
    if (!existingRecipe) {
      throw new Error(`レシピが見つかりません: ${id}`);
    }

    // Value Object を生成
    const ingredients = request.ingredients.map((i) => Ingredient.create(i));
    const steps = request.steps_array.map((s, idx) => CookingStep.create(idx + 1, s));

    // 新しいドメインモデルを再構築（createdAtは既存のものを使用）
    const updatedRecipe = Recipe.reconstruct(
      recipeId,
      request.title,
      ingredients,
      steps,
      request.recipe_url,
      existingRecipe.getCreatedAt()
    );

    // リポジトリ経由で保存
    const savedRecipe = await this.recipeRepository.update(updatedRecipe);

    return toRecipeDto(savedRecipe);
  }
}
