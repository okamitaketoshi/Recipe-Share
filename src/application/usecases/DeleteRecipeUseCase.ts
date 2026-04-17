import { RecipeId } from '../../domain/models/RecipeId';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';

export class DeleteRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(id: string): Promise<void> {
    // RecipeId を生成
    const recipeId = RecipeId.create(id);

    // 存在確認
    const existingRecipe = await this.recipeRepository.findById(recipeId);
    if (!existingRecipe) {
      throw new Error(`レシピが見つかりません: ${id}`);
    }

    // 削除
    await this.recipeRepository.delete(recipeId);
  }
}
