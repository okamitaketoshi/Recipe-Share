# Issue #24: カスタムフックへの分離 - 設計ドキュメント

## 1. 概要

App.tsx（現在225行）の状態管理ロジックを3つのカスタムフックに抽出し、プレゼンテーション層の責務を明確化する。

**目標**: App.tsxを50行以下に削減し、保守性・再利用性を向上させる。

## 2. 現状分析

### 2.1 App.tsxの構造

```
App.tsx (225行)
├─ UseCase初期化 (L15-19) - 5行
├─ 状態管理 (L21-26) - 6行
│  ├─ recipes, loading
│  ├─ showForm, editingRecipe
│  └─ ingredientSearch, searchMode
├─ ロジック (L28-134) - 107行
│  ├─ useEffect (subscribe, fetchRecipes)
│  ├─ fetchRecipes
│  ├─ handleCreateRecipe
│  ├─ handleUpdateRecipe
│  ├─ handleDeleteRecipe
│  ├─ handleEdit, handleCloseForm
│  └─ getFilteredRecipes
└─ JSX (L138-221) - 84行
```

### 2.2 依存関係

**Application層**:
- `GetAllRecipesUseCase` - レシピ一覧取得
- `CreateRecipeUseCase` - レシピ作成
- `UpdateRecipeUseCase` - レシピ更新
- `DeleteRecipeUseCase` - レシピ削除
- `SearchRecipesByIngredientsUseCase` - 材料検索（既存）

**Infrastructure層**:
- `SupabaseRecipeRepository` - subscribe メソッド提供

**型**:
- `RecipeDto` - プレゼンテーション層で使用する型

## 3. 設計方針

### 3.1 フック分割戦略

App.tsxを以下の3つのカスタムフックに分離：

```
App.tsx (50行以下)
├─ useRecipes() - レシピ一覧管理
├─ useRecipeSearch() - 材料検索管理
└─ useRecipeForm() - フォーム状態管理
```

### 3.2 各フックの責務

#### 3.2.1 useRecipes

**責務**: レシピ一覧の状態管理とCRUD操作

**管理する状態**:
- `recipes: RecipeDto[]` - レシピ一覧
- `loading: boolean` - ローディング状態

**提供する関数**:
- `createRecipe(data): Promise<void>` - レシピ作成
- `updateRecipe(id, data): Promise<void>` - レシピ更新
- `deleteRecipe(id): Promise<void>` - レシピ削除
- `refetch(): Promise<void>` - レシピ一覧を再取得

**内部ロジック**:
- `useEffect` - 初期データ取得、Supabase Realtimeのsubscribe
- エラーハンドリング（後述）

**型定義**:
```typescript
interface UseRecipesReturn {
  recipes: RecipeDto[];
  loading: boolean;
  createRecipe: (data: CreateRecipeRequest) => Promise<void>;
  updateRecipe: (id: string, data: CreateRecipeRequest) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}
```

#### 3.2.2 useRecipeSearch

**責務**: 材料検索の状態管理とフィルタリング

**管理する状態**:
- `ingredientSearch: string` - 検索キーワード
- `searchMode: 'and' | 'or'` - 検索モード

**提供する関数**:
- `setIngredientSearch(value: string): void` - 検索キーワード設定
- `setSearchMode(mode: 'and' | 'or'): void` - 検索モード切り替え
- `getFilteredRecipes(recipes: RecipeDto[]): RecipeDto[]` - フィルタリング実行

**型定義**:
```typescript
interface UseRecipeSearchReturn {
  ingredientSearch: string;
  setIngredientSearch: (value: string) => void;
  searchMode: 'and' | 'or';
  setSearchMode: (mode: 'and' | 'or') => void;
  getFilteredRecipes: (recipes: RecipeDto[]) => RecipeDto[];
}
```

#### 3.2.3 useRecipeForm

**責務**: フォーム表示状態と編集中レシピの管理

**管理する状態**:
- `showForm: boolean` - フォーム表示状態
- `editingRecipe: RecipeDto | undefined` - 編集中レシピ

**提供する関数**:
- `openCreateForm(): void` - 新規作成フォームを開く
- `openEditForm(recipe: RecipeDto): void` - 編集フォームを開く
- `closeForm(): void` - フォームを閉じる

**型定義**:
```typescript
interface UseRecipeFormReturn {
  showForm: boolean;
  editingRecipe: RecipeDto | undefined;
  openCreateForm: () => void;
  openEditForm: (recipe: RecipeDto) => void;
  closeForm: () => void;
}
```

### 3.3 App.tsx リファクタリング後のイメージ

```tsx
function App() {
  const { recipes, loading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { ingredientSearch, setIngredientSearch, searchMode, setSearchMode, getFilteredRecipes } = useRecipeSearch();
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
    // JSX (既存のまま、ハンドラを変更)
  );
}
```

**予想行数**: 約45行

## 4. 重要な検討事項

### 4.1 検索ロジックの実装方針

**現状**:
- App.tsx: 同期的なローカルフィルタリング（L108-134）
- SearchRecipesByIngredientsUseCase: 非同期で検索実行

**選択肢**:

#### A案: 同期的フィルタリングを維持（推奨）

**メリット**:
- ✅ パフォーマンスが良い（メモリ内でフィルタリング）
- ✅ UIの応答性が高い（遅延なし）
- ✅ 既存の動作を維持（デグレリスクなし）

**デメリット**:
- ❌ UseCaseとの統一性が低い

**実装**:
```typescript
// useRecipeSearch.ts
const getFilteredRecipes = (recipes: RecipeDto[]) => {
  if (!ingredientSearch.trim()) return recipes;
  
  const searchTerms = ingredientSearch.split(/\s+/).filter(term => term.length > 0);
  // ... 既存のフィルタリングロジック
};
```

#### B案: SearchRecipesByIngredientsUseCaseを使用

**メリット**:
- ✅ Application層との統一性が高い
- ✅ 将来的にサーバーサイド検索に移行しやすい

**デメリット**:
- ❌ 非同期処理によるUI遅延
- ❌ loading状態の管理が複雑化
- ❌ 検索のたびにネットワークリクエストが発生する可能性

**実装**:
```typescript
// useRecipeSearch.ts
const [filteredRecipes, setFilteredRecipes] = useState<RecipeDto[]>([]);
const [searching, setSearching] = useState(false);

const searchRecipes = async (searchTerms: string[], mode: 'and' | 'or') => {
  setSearching(true);
  const results = await searchUseCase.execute(searchTerms, mode);
  setFilteredRecipes(results);
  setSearching(false);
};
```

**推奨**: **A案（同期的フィルタリング）**
- レシピ数が少ない場合（〜1000件）は同期フィルタリングで十分
- UIの応答性を優先
- 将来的にレシピ数が増えた場合はB案に移行を検討

### 4.2 エラーハンドリング方針

**現状**:
- App.tsx内でtry-catchし、`alert()`でエラー表示

**選択肢**:

#### A案: フック内でエラーハンドリングを完結（推奨）

**メリット**:
- ✅ コンポーネントがシンプルになる
- ✅ エラー状態を一元管理

**デメリット**:
- ❌ エラー表示方法が固定される

**実装**:
```typescript
// useRecipes.ts
const createRecipe = async (data: CreateRecipeRequest) => {
  try {
    await createRecipeUseCase.execute(data);
    await refetch();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'レシピの作成に失敗しました';
    alert(errorMessage); // または toast通知
  }
};
```

#### B案: エラーをコンポーネントに委譲

**メリット**:
- ✅ エラー表示方法を柔軟にカスタマイズ可能

**デメリット**:
- ❌ コンポーネントのロジックが増える
- ❌ 各コンポーネントで個別にエラーハンドリングが必要

**実装**:
```typescript
// useRecipes.ts
const [error, setError] = useState<Error | null>(null);

const createRecipe = async (data: CreateRecipeRequest) => {
  try {
    await createRecipeUseCase.execute(data);
    await refetch();
  } catch (error) {
    setError(error as Error);
    throw error; // コンポーネント側で処理
  }
};
```

**推奨**: **A案（フック内でエラーハンドリング完結）**
- 現状のalert()動作を維持
- 将来的にtoast通知に移行する場合も、フック内の修正だけで済む

### 4.3 ローディング状態の管理

**現状**:
- `loading: boolean` - 初回ロード時のみ

**選択肢**:

#### A案: 初回ロードのみloading管理（推奨）

**メリット**:
- ✅ シンプル
- ✅ 既存動作を維持

**実装**:
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchRecipes().finally(() => setLoading(false));
}, []);
```

#### B案: 全操作でloading管理

**メリット**:
- ✅ すべての操作でローディング表示可能

**デメリット**:
- ❌ 複雑化
- ❌ UI/UXの変更（デグレリスク）

**推奨**: **A案（初回ロードのみ）**
- 既存動作を維持
- CRUD操作は楽観的更新（即座に反映、エラー時はalert）

### 4.4 Supabase Realtimeのsubscription管理

**現状**:
- App.tsx内のuseEffectでsubscribe、cleanup時にunsubscribe

**選択肢**:

#### A案: useRecipes内のuseEffectで管理（推奨）

**メリット**:
- ✅ シンプル
- ✅ subscriptionのライフサイクルがフックと連動

**実装**:
```typescript
// useRecipes.ts
useEffect(() => {
  fetchRecipes();
  
  const unsubscribe = recipeRepository.subscribe(() => {
    fetchRecipes();
  });
  
  return unsubscribe;
}, []);
```

#### B案: 専用フック（useRealtimeSubscription）に分離

**メリット**:
- ✅ 関心の分離
- ✅ 他のエンティティでも再利用可能

**デメリット**:
- ❌ 過剰な抽象化（現時点ではレシピのみ）

**推奨**: **A案（useRecipes内で管理）**
- シンプルで理解しやすい
- 将来的に他のエンティティが増えた場合に分離を検討

### 4.5 フックの粒度

**現状の設計**: 3つのフック（useRecipes, useRecipeSearch, useRecipeForm）

**代替案**: 1つのフック（useRecipeApp）に統合

**推奨**: **3つのフックに分割**
- ✅ 単一責任原則
- ✅ 再利用性が高い（useRecipesは他のページでも使える）
- ✅ テストしやすい

## 5. 実装計画

### 5.1 実装順序

1. **useRecipeForm.ts** - 最もシンプル、影響範囲が小さい
2. **useRecipeSearch.ts** - 検索ロジックの移行
3. **useRecipes.ts** - 最も複雑、CRUD + subscription
4. **App.tsx** - フックを使用するようにリファクタリング

### 5.2 ファイル構成

```
src/
├── presentation/
│   ├── hooks/
│   │   ├── useRecipes.ts          # 新規作成
│   │   ├── useRecipeSearch.ts     # 新規作成
│   │   └── useRecipeForm.ts       # 新規作成
│   └── ...
├── App.tsx                         # 修正
└── ...
```

### 5.3 テスト戦略

各フックに対して以下のテストを実施：

**useRecipes**:
- [ ] 初回ロード時にレシピ一覧を取得
- [ ] レシピ作成が成功する
- [ ] レシピ更新が成功する
- [ ] レシピ削除が成功する
- [ ] エラー時にalertが表示される
- [ ] subscription経由でリアルタイム更新される

**useRecipeSearch**:
- [ ] 検索キーワードが正しく設定される
- [ ] 検索モードが切り替わる
- [ ] AND検索が正しく動作する
- [ ] OR検索が正しく動作する
- [ ] 全角/半角の正規化が動作する

**useRecipeForm**:
- [ ] 新規作成フォームが開く
- [ ] 編集フォームが開く（編集中レシピがセットされる）
- [ ] フォームが閉じる（状態がリセットされる）

## 6. デグレリスク

### 6.1 高リスク

| リスク | 対策 |
|--------|------|
| **subscription切断による自動更新の停止** | useRecipes内のuseEffectでcleanup関数を確実に返す |
| **検索フィルタリングロジックの不具合** | 既存のgetFilteredRecipesロジックをそのまま移行、E2Eテスト実施 |
| **UseCase初期化のタイミング問題** | 各フック内でrepository, usecaseをuseRefで保持（再生成を防ぐ） |

### 6.2 中リスク

| リスク | 対策 |
|--------|------|
| **エラーハンドリングの漏れ** | 全CRUD操作でtry-catchを徹底 |
| **ローディング状態の不整合** | loading状態をuseRecipes内で一元管理 |

### 6.3 低リスク

| リスク | 対策 |
|--------|------|
| **型定義の不一致** | TypeScriptの型チェックで検出 |
| **フォーム状態管理の不具合** | シンプルなロジックなのでリスク低 |

## 7. 破壊的変更

**なし** - 内部実装のリファクタリングのみで、外部インターフェースは変更なし

## 8. 受け入れ条件の確認

- [ ] 3つのカスタムフックが実装されている
  - [ ] `src/presentation/hooks/useRecipes.ts`
  - [ ] `src/presentation/hooks/useRecipeSearch.ts`
  - [ ] `src/presentation/hooks/useRecipeForm.ts`
- [ ] App.tsxから状態管理ロジックが削除されている
- [ ] App.tsxが50行以下になっている
- [ ] 既存機能が正常に動作する
  - [ ] レシピ一覧表示
  - [ ] レシピ作成
  - [ ] レシピ編集
  - [ ] レシピ削除
  - [ ] 材料検索（AND/OR）
  - [ ] リアルタイム更新
- [ ] フックが再利用可能な形で設計されている
- [ ] 既存機能にデグレがない

## 9. まとめ

### 9.1 設計の要点

1. **3つのフックに分割** - 単一責任原則、再利用性
2. **同期的フィルタリング** - パフォーマンスとUI応答性を優先
3. **フック内でエラーハンドリング完結** - コンポーネントをシンプルに
4. **初回ロードのみloading管理** - 既存動作を維持
5. **useRecipes内でsubscription管理** - シンプルで理解しやすい

### 9.2 実装後の期待効果

- ✅ App.tsx: 225行 → 約45行（80%削減）
- ✅ 状態管理ロジックが明確に分離
- ✅ カスタムフックが他のページでも再利用可能
- ✅ テストしやすい構造
- ✅ 保守性・可読性の向上

### 9.3 今後の拡張性

- React Query / SWRの導入（キャッシュ戦略）
- toast通知の導入（エラーハンドリング）
- 非同期検索の導入（レシピ数増加時）
- 他のエンティティへの適用（ユーザー管理など）
