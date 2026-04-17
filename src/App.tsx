import { ErrorBoundary } from './presentation/components/ErrorBoundary';
import { RecipeProvider } from './presentation/providers/RecipeProvider';
import { RecipeListPage } from './presentation/pages/RecipeListPage';

/**
 * アプリケーションのルートコンポーネント
 * ErrorBoundary、RecipeProvider（DIコンテナ）、RecipeListPageの階層構造を構成
 */
function App() {
  return (
    <ErrorBoundary>
      <RecipeProvider>
        <RecipeListPage />
      </RecipeProvider>
    </ErrorBoundary>
  );
}

export default App;
