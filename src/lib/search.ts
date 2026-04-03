import { Recipe } from './supabase';

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .trim();
}

export function matchIngredient(searchTerm: string, ingredient: string): boolean {
  const normalizedSearch = normalizeString(searchTerm);
  const normalizedIngredient = normalizeString(ingredient);

  return normalizedIngredient.includes(normalizedSearch);
}

export function filterRecipesByIngredients(
  recipes: Recipe[],
  ingredientSearchTerms: string[],
  searchMode: 'and' | 'or' = 'or'
): Recipe[] {
  if (ingredientSearchTerms.length === 0) {
    return recipes;
  }

  return recipes.filter((recipe) => {
    const recipeIngredients = recipe.ingredients.map((ingredient: string) =>
      normalizeString(ingredient)
    );

    if (searchMode === 'and') {
      return ingredientSearchTerms.every((term) =>
        recipeIngredients.some((ingredient: string) => ingredient.includes(normalizeString(term)))
      );
    } else {
      return ingredientSearchTerms.some((term) =>
        recipeIngredients.some((ingredient: string) => ingredient.includes(normalizeString(term)))
      );
    }
  });
}
