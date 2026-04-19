export type RecipeDTO = {
  id: string;
  title: string;
  ingredients: string[];
  steps_array: string[]; // stepsカラム削除に伴い、steps_arrayのみ使用
  recipe_url: string | null;
  created_at: string;
};
