import { useState } from 'react';
import { RecipeDto } from '../../application/dto/RecipeDto';

interface UseRecipeSearchReturn {
  ingredientSearch: string;
  setIngredientSearch: (value: string) => void;
  searchMode: 'and' | 'or';
  setSearchMode: (mode: 'and' | 'or') => void;
  getFilteredRecipes: (recipes: RecipeDto[]) => RecipeDto[];
}

/**
 * 材料検索の状態管理とフィルタリングを行うカスタムフック
 */
export function useRecipeSearch(): UseRecipeSearchReturn {
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'and' | 'or'>('or');

  /**
   * 検索キーワードに基づいてレシピをフィルタリングする
   * App.tsx L108-134の既存ロジックを移行
   */
  const getFilteredRecipes = (recipes: RecipeDto[]): RecipeDto[] => {
    if (!ingredientSearch.trim()) {
      return recipes;
    }

    const searchTerms = ingredientSearch.split(/\s+/).filter((term) => term.length > 0);
    const normalizeString = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
        .trim();
    };

    return recipes.filter((recipe) => {
      const normalizedIngredients = recipe.ingredients.map((ing) => normalizeString(ing));

      if (searchMode === 'and') {
        return searchTerms.every((term) =>
          normalizedIngredients.some((ing) => ing.includes(normalizeString(term)))
        );
      } else {
        return searchTerms.some((term) =>
          normalizedIngredients.some((ing) => ing.includes(normalizeString(term)))
        );
      }
    });
  };

  return {
    ingredientSearch,
    setIngredientSearch,
    searchMode,
    setSearchMode,
    getFilteredRecipes,
  };
}
