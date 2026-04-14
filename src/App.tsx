import { useState, useEffect } from 'react';
import { Plus, ChefHat } from 'lucide-react';
import { supabase, Recipe } from './lib/supabase';
import { RecipeCard } from './components/RecipeCard';
import { RecipeForm } from './components/RecipeForm';
import { IngredientSearch } from './components/IngredientSearch';
import { filterRecipesByIngredients } from './lib/search';
import { SupabaseRecipeRepository } from './infrastructure/repositories/SupabaseRecipeRepository';

function App() {
  const recipeRepository = new SupabaseRecipeRepository(supabase);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'and' | 'or'>('or');

  useEffect(() => {
    fetchRecipes();

    const channel = supabase
      .channel('recipes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
        fetchRecipes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecipes = async () => {
    try {
      const data = await recipeRepository.findAll();
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
      await recipeRepository.create(data);
      await fetchRecipes();
      setShowForm(false);
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('レシピの投稿に失敗しました。もう一度お試しください。');
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
      await recipeRepository.update(editingRecipe.id, data);
      await fetchRecipes();
      setEditingRecipe(undefined);
      setShowForm(false);
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('レシピの更新に失敗しました。もう一度お試しください。');
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await recipeRepository.delete(id);
      await fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('レシピの削除に失敗しました。もう一度お試しください。');
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipe(undefined);
  };

  const filteredRecipes = ingredientSearch.trim()
    ? filterRecipesByIngredients(
        recipes,
        ingredientSearch.split(/\s+/).filter((term) => term.length > 0),
        searchMode
      )
    : recipes;

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
        ) : filteredRecipes.length === 0 ? (
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
            {filteredRecipes.map((recipe) => (
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
