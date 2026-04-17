import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { RecipeDto } from '../application/dto/RecipeDto';

interface RecipeFormProps {
  recipe?: RecipeDto;
  onSubmit: (data: {
    title: string;
    ingredients: string[];
    steps_array: string[];
    recipe_url: string | null;
  }) => void;
  onClose: () => void;
}

export function RecipeForm({ recipe, onSubmit, onClose }: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title || '');
  const [ingredients, setIngredients] = useState<string[]>(recipe?.ingredients || ['']);
  const [steps, setSteps] = useState<string[]>(recipe?.steps_array || ['']);
  const [recipeUrl, setRecipeUrl] = useState(recipe?.recipe_url || '');

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : ['']);
      setSteps(recipe.steps_array.length > 0 ? recipe.steps_array : ['']);
      setRecipeUrl(recipe.recipe_url || '');
    }
  }, [recipe]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredIngredients = ingredients.filter((i) => i.trim() !== '');
    const filteredSteps = steps.filter((s) => s.trim() !== '');
    if (title.trim() && filteredIngredients.length > 0 && filteredSteps.length > 0) {
      onSubmit({
        title,
        ingredients: filteredIngredients,
        steps_array: filteredSteps,
        recipe_url: recipeUrl.trim() || null,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {recipe ? 'レシピを編集' : '新しいレシピ'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              レシピ名
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例: チョコレートケーキ"
              required
            />
          </div>

          <div>
            <label htmlFor="recipeUrl" className="block text-sm font-semibold text-gray-700 mb-2">
              レシピURL（オプション）
            </label>
            <input
              id="recipeUrl"
              type="url"
              value={recipeUrl}
              onChange={(e) => setRecipeUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/recipe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">材料</label>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 小麦粉 200g"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={ingredients.length === 1}
                    aria-label="削除"
                  >
                    <Minus size={20} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={20} />
                材料を追加
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">作り方</label>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <textarea
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`手順 ${index + 1}`}
                    rows={2}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
                    disabled={steps.length === 1}
                    aria-label="削除"
                  >
                    <Minus size={20} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={20} />
                手順を追加
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {recipe ? '更新する' : '投稿する'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
