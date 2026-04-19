import { createContext, ReactNode, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import { SupabaseRecipeRepository } from '../../infrastructure/repositories/SupabaseRecipeRepository';
import { GetAllRecipesUseCase } from '../../application/usecases/GetAllRecipesUseCase';
import { CreateRecipeUseCase } from '../../application/usecases/CreateRecipeUseCase';
import { UpdateRecipeUseCase } from '../../application/usecases/UpdateRecipeUseCase';
import { DeleteRecipeUseCase } from '../../application/usecases/DeleteRecipeUseCase';

/**
 * RecipeContextで提供する値の型定義
 * DIコンテナとして、リポジトリと全てのユースケースを提供
 */
export interface RecipeContextValue {
  recipeRepository: IRecipeRepository;
  getAllRecipesUseCase: GetAllRecipesUseCase;
  createRecipeUseCase: CreateRecipeUseCase;
  updateRecipeUseCase: UpdateRecipeUseCase;
  deleteRecipeUseCase: DeleteRecipeUseCase;
}

/**
 * RecipeContext - リポジトリとユースケースを子コンポーネントに提供するContext
 */
export const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

/**
 * RecipeProviderのプロパティ
 */
interface RecipeProviderProps {
  children: ReactNode;
}

/**
 * RecipeProvider - DIコンテナとして機能するProviderコンポーネント
 * リポジトリとユースケースのインスタンスを生成し、Contextを通じて子コンポーネントに提供する
 *
 * @remarks
 * - useMemoを使用して不要な再生成を防止
 * - SupabaseRecipeRepositoryをインスタンス化
 * - 全てのユースケース（GetAll, Create, Update, Delete）を初期化
 */
export function RecipeProvider({ children }: RecipeProviderProps): JSX.Element {
  // リポジトリのインスタンス化（メモ化して再生成を防ぐ）
  const recipeRepository = useMemo(() => new SupabaseRecipeRepository(supabase), []);

  // 各ユースケースのインスタンス化（リポジトリに依存）
  const getAllRecipesUseCase = useMemo(
    () => new GetAllRecipesUseCase(recipeRepository),
    [recipeRepository]
  );

  const createRecipeUseCase = useMemo(
    () => new CreateRecipeUseCase(recipeRepository),
    [recipeRepository]
  );

  const updateRecipeUseCase = useMemo(
    () => new UpdateRecipeUseCase(recipeRepository),
    [recipeRepository]
  );

  const deleteRecipeUseCase = useMemo(
    () => new DeleteRecipeUseCase(recipeRepository),
    [recipeRepository]
  );

  // Context valueをメモ化（全ての依存関係が変更されたときのみ再生成）
  const value = useMemo(
    () => ({
      recipeRepository,
      getAllRecipesUseCase,
      createRecipeUseCase,
      updateRecipeUseCase,
      deleteRecipeUseCase,
    }),
    [
      recipeRepository,
      getAllRecipesUseCase,
      createRecipeUseCase,
      updateRecipeUseCase,
      deleteRecipeUseCase,
    ]
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}
