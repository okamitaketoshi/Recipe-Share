import { useState } from 'react';
import { RecipeDto } from '../../application/dto/RecipeDto';

interface UseRecipeFormReturn {
  showForm: boolean;
  editingRecipe: RecipeDto | undefined;
  openCreateForm: () => void;
  openEditForm: (recipe: RecipeDto) => void;
  closeForm: () => void;
}

/**
 * レシピフォームの表示状態と編集中レシピを管理するカスタムフック
 */
export function useRecipeForm(): UseRecipeFormReturn {
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeDto | undefined>();

  const openCreateForm = () => {
    setShowForm(true);
    setEditingRecipe(undefined);
  };

  const openEditForm = (recipe: RecipeDto) => {
    setShowForm(true);
    setEditingRecipe(recipe);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecipe(undefined);
  };

  return {
    showForm,
    editingRecipe,
    openCreateForm,
    openEditForm,
    closeForm,
  };
}
