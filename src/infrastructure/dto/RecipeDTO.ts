export type RecipeDTO = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string;
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
