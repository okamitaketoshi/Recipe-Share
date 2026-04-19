/**
 * Supabaseから取得する生のデータ型定義
 * DBカラム名そのまま（snake_case）
 */
export type RecipeRow = {
  id: string;
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
