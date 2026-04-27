import { Plus, ChefHat } from 'lucide-react';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeForm } from '../components/RecipeForm';
import { IngredientSearch } from '../components/IngredientSearch';
import { CreateRecipeRequest } from '../../application/dto/CreateRecipeRequest';
import { useRecipes } from '../hooks/useRecipes';
import { useRecipeSearch } from '../hooks/useRecipeSearch';
import { useRecipeForm } from '../hooks/useRecipeForm';

/**
 * レシピ一覧ページコンポーネント
 * レシピの表示、検索、作成、編集、削除を行う
 */
export function RecipeListPage(): JSX.Element {
  const { recipes, loading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { ingredientSearch, setIngredientSearch, searchMode, setSearchMode, getFilteredRecipes } =
    useRecipeSearch();
  const { showForm, editingRecipe, openCreateForm, openEditForm, closeForm } = useRecipeForm();

  const displayedRecipes = getFilteredRecipes(recipes);

  const handleSubmit = async (data: CreateRecipeRequest) => {
    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, data);
    } else {
      await createRecipe(data);
    }
    closeForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="text-orange-600" size={32} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">みんなのレシピ</h1>
            </div>
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">レシピを投稿</span>
              <span className="sm:hidden">投稿</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && recipes.length > 0 && (
          <IngredientSearch
            value={ingredientSearch}
            onChange={setIngredientSearch}
            onSearchModeChange={setSearchMode}
            searchMode={searchMode}
          />
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-xl text-gray-600 mb-4">まだレシピがありません</p>
            <p className="text-gray-500 mb-6">最初のレシピを投稿してみましょう！</p>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              <Plus size={20} />
              レシピを投稿
            </button>
          </div>
        ) : displayedRecipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-xl text-gray-600 mb-4">その材料で作れるレシピはまだありません</p>
            <p className="text-gray-500 mb-6">新しく投稿しませんか？</p>
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              <Plus size={20} />
              レシピを投稿
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={openEditForm}
                onDelete={deleteRecipe}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <RecipeForm recipe={editingRecipe} onSubmit={handleSubmit} onClose={closeForm} />
      )}
    </div>
  );
}
