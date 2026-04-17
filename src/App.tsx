import { useState, useEffect } from 'react';
import { Plus, ChefHat } from 'lucide-react';
import { supabase } from './lib/supabase';
import { RecipeCard } from './components/RecipeCard';
import { RecipeForm } from './components/RecipeForm';
import { IngredientSearch } from './components/IngredientSearch';
import { SupabaseRecipeRepository } from './infrastructure/repositories/SupabaseRecipeRepository';
import { GetAllRecipesUseCase } from './application/usecases/GetAllRecipesUseCase';
import { CreateRecipeUseCase } from './application/usecases/CreateRecipeUseCase';
import { UpdateRecipeUseCase } from './application/usecases/UpdateRecipeUseCase';
import { DeleteRecipeUseCase } from './application/usecases/DeleteRecipeUseCase';
import { RecipeDto } from './application/dto/RecipeDto';

function App() {
  const recipeRepository = new SupabaseRecipeRepository(supabase);
  const getAllRecipesUseCase = new GetAllRecipesUseCase(recipeRepository);
  const createRecipeUseCase = new CreateRecipeUseCase(recipeRepository);
  const updateRecipeUseCase = new UpdateRecipeUseCase(recipeRepository);
  const deleteRecipeUseCase = new DeleteRecipeUseCase(recipeRepository);

  const [recipes, setRecipes] = useState<RecipeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeDto | undefined>();
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'and' | 'or'>('or');

  useEffect(() => {
    fetchRecipes();

    const unsubscribe = recipeRepository.subscribe(() => {
      fetchRecipes();
    });

    return unsubscribe;
  }, []);

  const fetchRecipes = async () => {
    try {
      const data = await getAllRecipesUseCase.execute();
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecipe = async (data: {
    title: string;
    ingredients: string[];
    steps_array: string[];
    recipe_url: string | null;
  }) => {
    try {
      await createRecipeUseCase.execute(data);
      await fetchRecipes();
      setShowForm(false);
    } catch (error) {
      console.error('Error creating recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'レシピの投稿に失敗しました';
      alert(errorMessage);
    }
  };

  const handleUpdateRecipe = async (data: {
    title: string;
    ingredients: string[];
    steps_array: string[];
    recipe_url: string | null;
  }) => {
    if (!editingRecipe) return;

    try {
      await updateRecipeUseCase.execute(editingRecipe.id, data);
      await fetchRecipes();
      setEditingRecipe(undefined);
      setShowForm(false);
    } catch (error) {
      console.error('Error updating recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'レシピの更新に失敗しました';
      alert(errorMessage);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await deleteRecipeUseCase.execute(id);
      await fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'レシピの削除に失敗しました';
      alert(errorMessage);
    }
  };

  const handleEdit = (recipe: RecipeDto) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipe(undefined);
  };

  // 検索機能を同期的に実装
  const getFilteredRecipes = () => {
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

  const displayedRecipes = getFilteredRecipes();

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
              onClick={() => setShowForm(true)}
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
              onClick={() => setShowForm(true)}
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
              onClick={() => setShowForm(true)}
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
                onEdit={handleEdit}
                onDelete={handleDeleteRecipe}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSubmit={editingRecipe ? handleUpdateRecipe : handleCreateRecipe}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

export default App;
