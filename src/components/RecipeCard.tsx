import { CreditCard as Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Recipe } from '../lib/supabase';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex-1">{recipe.title}</h3>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(recipe)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="編集"
          >
            <Edit2 size={20} />
          </button>
          <button
            onClick={() => onDelete(recipe.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="削除"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {recipe.recipe_url && (
        <div className="mb-4">
          <a
            href={recipe.recipe_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm break-all"
          >
            <ExternalLink size={16} />
            レシピURL
          </a>
        </div>
      )}

      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">材料</h4>
        <ul className="list-disc list-inside space-y-1">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="text-gray-600">
              {ingredient}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2">作り方</h4>
        <ol className="space-y-3">
          {recipe.steps_array && recipe.steps_array.length > 0 ? (
            recipe.steps_array.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-gray-600">{step}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-600 whitespace-pre-wrap">{recipe.steps}</p>
          )}
        </ol>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        {new Date(recipe.created_at).toLocaleString('ja-JP')}
      </div>
    </div>
  );
}
