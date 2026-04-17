export interface CreateRecipeRequest {
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
}
