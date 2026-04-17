import { useContext } from 'react';
import { RecipeContext, RecipeContextValue } from '../providers/RecipeProvider';

/**
 * RecipeContextを取得するカスタムフック
 *
 * @throws {Error} RecipeProvider外で使用した場合にエラーをスロー
 * @returns RecipeContextの値（リポジトリと全ユースケース）
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { getAllRecipesUseCase, createRecipeUseCase } = useRecipeContext();
 *   // ... ユースケースを使用
 * }
 * ```
 */
export function useRecipeContext(): RecipeContextValue {
  const context = useContext(RecipeContext);

  if (!context) {
    throw new Error('useRecipeContext must be used within RecipeProvider');
  }

  return context;
}
