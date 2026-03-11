import { Search, X, Refrigerator } from 'lucide-react';

interface IngredientSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearchModeChange?: (mode: 'and' | 'or') => void;
  searchMode?: 'and' | 'or';
}

export function IngredientSearch({
  value,
  onChange,
  onSearchModeChange,
  searchMode = 'or',
}: IngredientSearchProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 mb-8 border border-orange-100">
      <div className="flex items-center gap-3 mb-4">
        <Refrigerator size={24} className="text-orange-600" />
        <h2 className="text-lg font-semibold text-gray-800">今ある材料で検索</h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="例：たまねぎ 豚肉（スペース区切りで複数入力可）"
            className="w-full pl-10 pr-10 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="クリア"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onSearchModeChange?.('or')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              searchMode === 'or'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-300'
            }`}
          >
            いずれかを含む
          </button>
          <button
            onClick={() => onSearchModeChange?.('and')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              searchMode === 'and'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-300'
            }`}
          >
            全てを含む
          </button>
        </div>

        {value && (
          <div className="flex flex-wrap gap-2">
            {value.split(/\s+/).map(
              (term, index) =>
                term && (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-orange-200"
                  >
                    {term}
                    <button
                      onClick={() => {
                        const terms = value.split(/\s+/).filter((_, i) => i !== index);
                        onChange(terms.join(' '));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
