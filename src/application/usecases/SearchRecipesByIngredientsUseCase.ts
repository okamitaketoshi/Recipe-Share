import { RecipeDto } from '../dto/RecipeDto';
import { GetAllRecipesUseCase } from './GetAllRecipesUseCase';

export class SearchRecipesByIngredientsUseCase {
  constructor(private getAllRecipesUseCase: GetAllRecipesUseCase) {}

  async execute(searchTerms: string[], mode: 'and' | 'or' = 'or'): Promise<RecipeDto[]> {
    // 全レシピ取得
    const allRecipes = await this.getAllRecipesUseCase.execute();

    // 検索語がない場合はそのまま返す
    if (searchTerms.length === 0) {
      return allRecipes;
    }

    // フィルタリング実行（既存のsearch.tsロジックを移行）
    return allRecipes.filter((recipe) => {
      const normalizedIngredients = recipe.ingredients.map((ing) => this.normalizeString(ing));

      if (mode === 'and') {
        return searchTerms.every((term) =>
          normalizedIngredients.some((ing) => ing.includes(this.normalizeString(term)))
        );
      } else {
        return searchTerms.some((term) =>
          normalizedIngredients.some((ing) => ing.includes(this.normalizeString(term)))
        );
      }
    });
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      .trim();
  }
}
