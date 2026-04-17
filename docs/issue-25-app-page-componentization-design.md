# Issue #25: App.tsxのページコンポーネント化 - 設計ドキュメント

## 概要

App.tsxをRecipeListPageとして分離し、DIコンテナ（RecipeProvider）を導入してルーティング対応可能な構造に変更する。

## 設計方針（確定）

| 項目 | 採用方針 | 理由 |
|------|----------|------|
| DIコンテナ実装 | Context API | React標準、追加ライブラリ不要、React Routerとの親和性が高い |
| Provider配置 | App.tsx内 | シンプルで将来的なルーティング追加時も自然に拡張できる |
| エラーバウンダリ | 今回実装する | ユーザーエクスペリエンス向上のため |
| useRecipes注入 | Contextから取得 | 完全なDI実現、テスト容易性向上 |

## アーキテクチャ図

### 変更前（現在）

```
App.tsx (110行)
  ├─ useRecipes() ← リポジトリ/ユースケースを内部で生成
  ├─ useRecipeSearch()
  ├─ useRecipeForm()
  └─ JSX (ヘッダー、検索、一覧、フォーム)
```

### 変更後

```
App.tsx (40-50行)
  └─ ErrorBoundary
       └─ RecipeProvider (DIコンテナ)
            └─ RecipeListPage
                 ├─ useRecipeContext() ← Contextからリポジトリ/ユースケース取得
                 ├─ useRecipes() ← 注入された依存関係を使用
                 ├─ useRecipeSearch()
                 ├─ useRecipeForm()
                 └─ JSX (ヘッダー、検索、一覧、フォーム)
```

## ファイル構成

### 新規作成ファイル

#### 1. `src/presentation/pages/RecipeListPage.tsx`

**役割**: レシピ一覧ページのプレゼンテーションロジック

**内容**:
- 現在のApp.tsx L27-106のJSXを移行
- カスタムフック（`useRecipes`, `useRecipeSearch`, `useRecipeForm`）を使用
- 純粋なプレゼンテーションコンポーネント
- ビジネスロジックは含まない

**推定行数**: 80-90行

#### 2. `src/presentation/providers/RecipeProvider.tsx`

**役割**: DIコンテナ（依存関係の注入）

**提供する内容**:
- `SupabaseRecipeRepository`インスタンス
- 各UseCase（GetAll, Create, Update, Delete）インスタンス
- Context経由で子コンポーネントに提供

**実装パターン**:
```typescript
interface RecipeContextValue {
  recipeRepository: RecipeRepository;
  getAllRecipesUseCase: GetAllRecipesUseCase;
  createRecipeUseCase: CreateRecipeUseCase;
  updateRecipeUseCase: UpdateRecipeUseCase;
  deleteRecipeUseCase: DeleteRecipeUseCase;
}

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const recipeRepository = useMemo(() => new SupabaseRecipeRepository(supabase), []);
  const getAllRecipesUseCase = useMemo(() => new GetAllRecipesUseCase(recipeRepository), [recipeRepository]);
  // ... 他のUseCaseも同様

  const value = useMemo(() => ({
    recipeRepository,
    getAllRecipesUseCase,
    createRecipeUseCase,
    updateRecipeUseCase,
    deleteRecipeUseCase,
  }), [/* ... */]);

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}
```

**推定行数**: 50-60行

#### 3. `src/presentation/hooks/useRecipeContext.ts`

**役割**: RecipeContextを取得するカスタムフック

**内容**:
```typescript
export function useRecipeContext(): RecipeContextValue {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipeContext must be used within RecipeProvider');
  }
  return context;
}
```

**推定行数**: 10-15行

#### 4. `src/presentation/components/ErrorBoundary.tsx`

**役割**: エラーハンドリング（Reactエラーバウンダリ）

**機能**:
- Reactコンポーネントツリー内のエラーをキャッチ
- ユーザーフレンドリーなエラーUI表示
- エラー詳細をconsole.errorに出力

**実装パターン**:
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackUI error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**推定行数**: 60-70行

### 修正ファイル

#### 5. `src/App.tsx`

**変更内容**:
- JSX部分を削除（RecipeListPageに移行）
- ErrorBoundary + RecipeProvider + RecipeListPageの階層構造に変更
- import文を整理

**変更後の構造**:
```typescript
import { ErrorBoundary } from './presentation/components/ErrorBoundary';
import { RecipeProvider } from './presentation/providers/RecipeProvider';
import { RecipeListPage } from './presentation/pages/RecipeListPage';

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
```

**推定行数**: 15-20行（目標: 50行以下）

#### 6. `src/presentation/hooks/useRecipes.ts`

**変更内容**:
- リポジトリ/ユースケースの生成コード削除（L28-32）
- `useRecipeContext()`を使用してContextから取得
- それ以外のロジックは維持

**変更箇所**:
```typescript
// 変更前（L28-32）
const recipeRepository = useRef(new SupabaseRecipeRepository(supabase)).current;
const getAllRecipesUseCase = useRef(new GetAllRecipesUseCase(recipeRepository)).current;
// ...

// 変更後
const {
  recipeRepository,
  getAllRecipesUseCase,
  createRecipeUseCase,
  updateRecipeUseCase,
  deleteRecipeUseCase,
} = useRecipeContext();
```

**推定行数**: 110行 → 105行（-5行）

## 実装順序

### Phase 1: 基盤構築
1. `ErrorBoundary.tsx` 作成
2. `RecipeProvider.tsx` 作成
3. `useRecipeContext.ts` 作成

### Phase 2: フック修正
4. `useRecipes.ts` 修正（Context注入対応）

### Phase 3: ページ分離
5. `RecipeListPage.tsx` 作成（App.tsxのJSXを移行）
6. `App.tsx` 簡略化

### Phase 4: 動作確認
7. ビルド確認
8. 開発サーバー起動
9. 既存機能の動作確認

## デグレリスク対策

### 🔴 高リスク: useRecipesフックの内部構造変更

**リスク内容**:
- リポジトリ/ユースケースの生成方法を変更
- Contextから取得する方式に変更
- 依存関係の初期化タイミングが変わる

**対策**:
1. RecipeProviderで`useMemo`を使用して不要な再生成を防ぐ
2. useRecipesフックの戻り値の型は変更しない（インターフェース維持）
3. 動作確認時に以下をテスト:
   - レシピ一覧表示
   - レシピ作成
   - レシピ編集
   - レシピ削除
   - Realtime更新

### 🟡 中リスク: App.tsxのJSX構造移行

**リスク内容**:
- JSXを完全にRecipeListPageに移行
- イベントハンドラやpropsの受け渡しミス

**対策**:
1. JSXは1行も変更せずにコピー&ペースト
2. import文を適切に調整
3. UIの見た目と動作を全て確認

### 🟢 低リスク: ErrorBoundary追加

**リスク内容**:
- 新機能追加のため、既存機能への影響は最小限

**対策**:
1. ErrorBoundary内でエラーが発生しないよう、シンプルな実装
2. エラーが発生した場合のフォールバックUIを用意

## 検証項目

### 機能テスト

- [ ] レシピ一覧が正しく表示される
- [ ] 材料検索が正しく動作する（AND/OR検索）
- [ ] レシピ作成フォームが開く
- [ ] レシピを作成できる
- [ ] レシピ編集フォームが開く
- [ ] レシピを編集できる
- [ ] レシピを削除できる
- [ ] Realtime更新が動作する（別タブで変更した内容が反映される）
- [ ] エラー発生時にErrorBoundaryが動作する

### UI/UXテスト

- [ ] ヘッダーが正しく表示される
- [ ] レシピカードが正しく表示される
- [ ] 空状態のメッセージが正しく表示される
- [ ] 検索結果0件のメッセージが正しく表示される
- [ ] ローディング状態が正しく表示される
- [ ] フォームモーダルが正しく表示される
- [ ] レスポンシブデザインが正しく動作する

### コードレビュー項目

- [ ] App.tsxが50行以下である
- [ ] RecipeListPageが純粋なプレゼンテーションコンポーネントである
- [ ] RecipeProviderがDIコンテナとして機能している
- [ ] useRecipesがContextから依存関係を取得している
- [ ] ErrorBoundaryが適切に実装されている
- [ ] 既存のimport文が整理されている
- [ ] TypeScriptの型エラーがない
- [ ] ESLintエラーがない

## 受け入れ条件

- [x] RecipeListPageが作成されていること
- [x] RecipeProviderでDI構造が実現されていること
- [x] App.tsxが50行以下であること
- [ ] 既存UIが完全に維持されていること（動作確認で検証）
- [ ] 既存機能にデグレがないこと（動作確認で検証）
- [x] 将来的なルーティング追加が容易な構造であること
- [x] ErrorBoundaryが実装されていること（ユーザー要望により追加）

## 追加スコープ

### ErrorBoundary実装（ユーザー要望）

issueの元々のスコープには含まれていませんでしたが、ユーザーの要望により今回実装します。

**追加理由**:
- ユーザーエクスペリエンス向上
- エラー発生時の適切なハンドリング
- 将来的なデバッグの容易性

**影響**:
- App.tsx行数が若干増加（+3-5行程度）
- 新規ファイル追加（ErrorBoundary.tsx）

## 将来的な拡張性

### React Router導入時の構造

```typescript
// App.tsx（将来）
function App() {
  return (
    <ErrorBoundary>
      <RecipeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RecipeListPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Router>
      </RecipeProvider>
    </ErrorBoundary>
  );
}
```

今回の実装により、上記のような構造への拡張が容易になります。

## まとめ

この設計により、以下が実現されます：

1. ✅ App.tsxの簡略化（110行 → 15-20行）
2. ✅ DIコンテナの導入（RecipeProvider）
3. ✅ ページコンポーネントの分離（RecipeListPage）
4. ✅ エラーハンドリングの改善（ErrorBoundary）
5. ✅ 将来的なルーティング追加の容易性
6. ✅ テスト容易性の向上（DI注入により）

既存のUIと機能は完全に維持され、内部構造のみリファクタリングされます。
