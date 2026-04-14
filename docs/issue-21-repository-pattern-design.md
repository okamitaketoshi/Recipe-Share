# Issue #21: リポジトリパターン導入 - 設計ドキュメント

## 1. 現状分析

### 1.1 現在のデータアクセス構造

**App.tsx (L32-114)** に以下のSupabase直接呼び出しが存在：

```typescript
// L32-46: レシピ一覧取得
const fetchRecipes = async () => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  // ...
};

// L48-72: レシピ作成
const handleCreateRecipe = async (data) => {
  const { error } = await supabase.from('recipes').insert([...]);
  // ...
};

// L74-102: レシピ更新
const handleUpdateRecipe = async (data) => {
  const { error } = await supabase
    .from('recipes')
    .update({...})
    .eq('id', editingRecipe.id);
  // ...
};

// L104-114: レシピ削除
const handleDeleteRecipe = async (id: string) => {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  // ...
};
```

### 1.2 リアルタイム更新

**App.tsx (L20-25)** でSupabaseチャンネルを直接使用：

```typescript
const channel = supabase
  .channel('recipes-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
    fetchRecipes();
  })
  .subscribe();
```

### 1.3 Recipe型定義

**src/lib/supabase.ts (L23-31)**:

```typescript
export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string;
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
```

## 2. 設計方針

### 2.1 ディレクトリ構造

クリーンアーキテクチャに従った新しい構造：

```
src/
├── domain/
│   ├── entities/          # ドメインモデル（後続issue）
│   └── repositories/      # リポジトリインターフェース
│       └── IRecipeRepository.ts
├── infrastructure/
│   └── repositories/      # リポジトリ具象実装
│       └── SupabaseRecipeRepository.ts
├── application/           # ユースケース層（後続issue）
└── presentation/          # UI層（後存のcomponents等）
```

### 2.2 リポジトリインターフェース設計

**domain/repositories/IRecipeRepository.ts**

```typescript
export interface IRecipeRepository {
  findAll(): Promise<Recipe[]>;
  findById(id: string): Promise<Recipe | null>;
  create(data: CreateRecipeData): Promise<Recipe>;
  update(id: string, data: UpdateRecipeData): Promise<Recipe>;
  delete(id: string): Promise<void>;
}

export type CreateRecipeData = {
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
};

export type UpdateRecipeData = CreateRecipeData;
```

### 2.3 リポジトリ具象実装

**infrastructure/repositories/SupabaseRecipeRepository.ts**

- `IRecipeRepository`を実装
- Supabaseクライアントをコンストラクタで受け取る（依存性注入）
- 現在App.tsxにあるSupabase呼び出しロジックをそのまま移動
- エラーハンドリングは現状と同じ（throw error）

## 3. 要検討事項と提案

### 3.1 エラーハンドリング方針

**Option A: Result型（推奨）**

```typescript
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface IRecipeRepository {
  findAll(): Promise<Result<Recipe[]>>;
  findById(id: string): Promise<Result<Recipe | null>>;
  // ...
}
```

**メリット**:
- 型安全なエラーハンドリング
- 呼び出し側で明示的にエラーチェック
- 将来的にエラー種別の分類が容易

**デメリット**:
- App.tsx側の変更が大きい（try-catchからif-else分岐へ）
- 既存のコードスタイルと異なる

**Option B: 例外スロー（現状維持）**

```typescript
export interface IRecipeRepository {
  findAll(): Promise<Recipe[]>;
  findById(id: string): Promise<Recipe | null>;
  // ...
}
```

**メリット**:
- 既存のtry-catchパターンをそのまま使える
- App.tsx側の変更が最小限
- シンプルで分かりやすい

**デメリット**:
- エラーの種類が型で表現されない
- 想定外のエラーを見逃しやすい

### 3.2 Recipeモデルの配置

**Option A: domain/entities/Recipe.ts へ移動（推奨）**

```typescript
// domain/entities/Recipe.ts
export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string;
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
```

**メリット**:
- クリーンアーキテクチャのレイヤー分離が明確
- 後続issue（#22: ドメインモデル作成）の準備になる

**デメリット**:
- 既存のimport文を全て修正する必要がある
- 変更範囲が広がる

**Option B: supabase.tsに残す（現状維持）**

**メリット**:
- 変更範囲が最小限
- 既存コードへの影響が少ない

**デメリット**:
- インフラ層にドメインモデルが存在する違和感
- 後続issueで再度移動が必要

### 3.3 リアルタイム更新の扱い

**現状**: App.tsxでsupabaseチャンネルを直接subscribe

**提案**: 現状維持（後続issueで検討）

**理由**:
- リアルタイム更新はアプリケーション層の関心事
- リポジトリパターンの範囲外
- 後続issue（#23: ユースケース層作成）で適切な位置に配置すべき

### 3.4 findByIdメソッドの必要性

**現状**: App.tsxではfindById相当の処理は存在しない

**提案**: インターフェースには定義するが、実装は最小限

**理由**:
- CRUDの完全性を保つため
- 将来的に詳細画面が必要になる可能性
- 実装コストは低い

## 4. 影響範囲の分析

### 4.1 修正が必要なファイル

1. **App.tsx**
   - supabaseへの直接参照を削除
   - リポジトリインスタンスの注入
   - データアクセスメソッドをリポジトリ経由に変更

2. **src/lib/supabase.ts** (Option Aの場合)
   - Recipe型をdomain/entities/Recipe.tsへ移動
   - supabaseクライアントのみ残す

### 4.2 新規作成が必要なファイル

1. **src/domain/repositories/IRecipeRepository.ts**
2. **src/infrastructure/repositories/SupabaseRecipeRepository.ts**
3. **src/domain/entities/Recipe.ts** (Option Aの場合)

### 4.3 影響を受けるコンポーネント

- **RecipeCard.tsx**: Recipe型のimportパス変更の可能性
- **RecipeForm.tsx**: Recipe型のimportパス変更の可能性
- **lib/search.ts**: Recipe型のimportパス変更の可能性

## 5. デグレリスクの評価

### 5.1 高リスク

**なし**

理由: 既存のビジネスロジックは変更せず、構造のみ変更するため

### 5.2 中リスク

**リポジトリの注入方法を誤ると、アプリが起動しない**

対策:
- App.tsx内でSupabaseRecipeRepositoryをインスタンス化
- 段階的な移行（まずfetchRecipesのみ移行してテスト）

### 5.3 低リスク

**型定義のimportパス変更によるビルドエラー**

対策:
- TypeScriptコンパイラが検出するため、実行前に気づける
- すべてのimport文を確認

## 6. 破壊的変更の有無

**破壊的変更: なし**

理由:
- UIの動作は一切変わらない
- APIの互換性は保たれる
- 内部構造の変更のみ

## 7. 実装ステップの提案

### Phase 1: 基本構造の作成

1. ディレクトリ作成
2. `IRecipeRepository.ts` 作成
3. `SupabaseRecipeRepository.ts` 作成（最小実装）

### Phase 2: Recipe型の配置決定と移動（Option Aの場合）

4. `domain/entities/Recipe.ts` 作成
5. すべてのimport文を修正

### Phase 3: App.tsxのリファクタリング

6. リポジトリインスタンスの注入
7. `fetchRecipes` をリポジトリ経由に変更
8. 動作確認（レシピ一覧表示）
9. `handleCreateRecipe` をリポジトリ経由に変更
10. 動作確認（レシピ作成）
11. `handleUpdateRecipe` をリポジトリ経由に変更
12. 動作確認（レシピ更新）
13. `handleDeleteRecipe` をリポジトリ経由に変更
14. 動作確認（レシピ削除）

### Phase 4: クリーンアップ

15. 不要なsupabase import削除
16. コード整形

## 8. 受け入れ条件の確認

- [ ] `IRecipeRepository`インターフェースが定義されていること
- [ ] `SupabaseRecipeRepository`が全CRUDメソッドを実装していること
- [ ] App.tsxからSupabaseへの直接参照が削除されていること
- [ ] 既存機能が正常に動作すること（レシピ取得・作成・更新・削除）
- [ ] 既存機能にデグレがないこと

## 9. 質問事項（ユーザーへの確認事項）

### 🔴 必須確認事項

1. **エラーハンドリング方針**: Option A (Result型) vs Option B (例外スロー)
   - 推奨: Option B（現状維持）- 変更範囲を最小化
   - 理由: 後続issueでユースケース層を作成する際に、エラーハンドリング戦略を統一的に設計すべき

2. **Recipe型の配置**: Option A (domain/entities/) vs Option B (supabase.ts維持)
   - 推奨: Option B（現状維持）
   - 理由: 後続issue #22（ドメインモデル作成）で適切に設計すべき。このissueでは構造変更を最小化

3. **実装の進め方**: 段階的（Phase単位でコミット）vs 一括（最後にまとめてコミット）
   - 推奨: 段階的
   - 理由: 問題が発生した際のロールバックが容易

### 💡 オプション確認事項

4. **findByIdメソッド**: 実装する vs スキップする
   - 推奨: 実装する（最小実装でOK）
   - 理由: CRUDの完全性、将来の拡張性

5. **リアルタイム更新**: 今回対応する vs 後続issueで対応
   - 推奨: 後続issueで対応
   - 理由: リポジトリパターンの範囲外

## 10. 推奨実装方針（まとめ）

以下の方針で実装を進めることを推奨します：

1. **エラーハンドリング**: 例外スロー（現状維持）
2. **Recipe型配置**: supabase.tsに残す（現状維持）
3. **実装の進め方**: 段階的（Phase単位）
4. **findByIdメソッド**: 実装する（最小実装）
5. **リアルタイム更新**: 後続issueで対応

この方針により：
- ✅ 変更範囲を最小化
- ✅ 既存コードへの影響を最小化
- ✅ デグレリスクを最小化
- ✅ 後続issueとの役割分担を明確化

ユーザーの承認を得てから、Developer Agentに実装を依頼します。
