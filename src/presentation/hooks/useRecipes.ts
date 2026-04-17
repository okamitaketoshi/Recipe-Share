import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { RecipeDto } from '../../application/dto/RecipeDto';
import { CreateRecipeRequest } from '../../application/dto/CreateRecipeRequest';
import { SupabaseRecipeRepository } from '../../infrastructure/repositories/SupabaseRecipeRepository';
import { GetAllRecipesUseCase } from '../../application/usecases/GetAllRecipesUseCase';
import { CreateRecipeUseCase } from '../../application/usecases/CreateRecipeUseCase';
import { UpdateRecipeUseCase } from '../../application/usecases/UpdateRecipeUseCase';
import { DeleteRecipeUseCase } from '../../application/usecases/DeleteRecipeUseCase';

interface UseRecipesReturn {
  recipes: RecipeDto[];
  loading: boolean;
  createRecipe: (data: CreateRecipeRequest) => Promise<void>;
  updateRecipe: (id: string, data: CreateRecipeRequest) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * レシピ一覧の状態管理とCRUD操作を行うカスタムフック
 */
export function useRecipes(): UseRecipesReturn {
  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [loading, setLoading] = useState(true);

  // UseCase初期化（useRefで再生成を防ぐ）
  const recipeRepository = useRef(new SupabaseRecipeRepository(supabase)).current;
  const getAllRecipesUseCase = useRef(new GetAllRecipesUseCase(recipeRepository)).current;
  const createRecipeUseCase = useRef(new CreateRecipeUseCase(recipeRepository)).current;
  const updateRecipeUseCase = useRef(new UpdateRecipeUseCase(recipeRepository)).current;
  const deleteRecipeUseCase = useRef(new DeleteRecipeUseCase(recipeRepository)).current;

  /**
   * レシピ一覧を取得する
   */
  const refetch = useCallback(async (): Promise<void> => {
    try {
      const data = await getAllRecipesUseCase.execute();
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  }, [getAllRecipesUseCase]);

  /**
   * レシピを作成する
   */
  const createRecipe = async (data: CreateRecipeRequest): Promise<void> => {
    try {
      await createRecipeUseCase.execute(data);
      await refetch();
    } catch (error) {
      console.error('Error creating recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'レシピの投稿に失敗しました';
      alert(errorMessage);
    }
  };

  /**
   * レシピを更新する
   */
  const updateRecipe = async (id: string, data: CreateRecipeRequest): Promise<void> => {
    try {
      await updateRecipeUseCase.execute(id, data);
      await refetch();
    } catch (error) {
      console.error('Error updating recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'レシピの更新に失敗しました';
      alert(errorMessage);
    }
  };

  /**
   * レシピを削除する
   */
  const deleteRecipe = async (id: string): Promise<void> => {
    try {
      await deleteRecipeUseCase.execute(id);
      await refetch();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'レシピの削除に失敗しました';
      alert(errorMessage);
    }
  };

  // 初回ロード + Supabase Realtimeのsubscribe
  useEffect(() => {
    refetch().finally(() => setLoading(false));

    const unsubscribe = recipeRepository.subscribe(() => {
      refetch();
    });

    return unsubscribe;
  }, [recipeRepository, refetch]);

  return {
    recipes,
    loading,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    refetch,
  };
}
