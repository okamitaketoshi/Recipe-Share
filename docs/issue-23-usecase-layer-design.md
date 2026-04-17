# Issue #23: ユースケース層の作成 - 設計ドキュメント

**作成日**: 2026-04-16  
**ステータス**: 設計確定  
**Issue URL**: https://github.com/okamitaketoshi/Recipe-Share/issues/23

---

## 📋 概要

アプリケーション層としてユースケースクラスを作成し、ビジネスロジックをプレゼンテーション層（App.tsx）から分離する。

### 目的

- ビジネスロジックとUI層の責任分離
- テスタビリティの向上
- 将来の機能拡張に対する保守性向上
- クリーンアーキテクチャの確立

---

## ⚠️ Issue #22完了による設計変更

**重要**: Issue #22で以下のドメインモデルが作成されました：
- `Recipe` クラス（エンティティ）
- `RecipeId`, `Ingredient`, `CookingStep` (Value Objects)
- バリデーションロジックを内包
- `Recipe.create()`, `Recipe.reconstruct()` ファクトリメソッド

この変更により、**リポジトリインターフェースの修正が必要**になりました。

### 現状の問題
- `IRecipeRepository` が `lib/supabase.ts` の古い型を使用
- ドメインモデルとリポジトリの型が不整合

### 対応方針
- **Issue #23でリポジトリインターフェースを修正**
- ドメインモデル（`Recipe`クラス）を返すように変更
- SupabaseRecipeRepository でデータベース型 → ドメインモデルの変換を実装

### 主な変更内容

| 項目 | 旧設計 | 新設計（Issue #22対応） |
|------|--------|------------------------|
| **リポジトリの戻り値** | `Recipe`（lib/supabase.ts） | `Recipe`（domain/models/Recipe.ts） |
| **リポジトリの引数** | `CreateRecipeData`, `UpdateRecipeData`, `string` | `Recipe`, `RecipeId` |
| **バリデーション** | ユースケース層で実施 | ドメインモデルが実施 |
| **エラークラス** | ValidationError等を作成 | 不要（ドメインモデルがErrorをthrow） |
| **ユースケースの役割** | バリデーション + ビジネスロジック | Value Object生成 + ドメインモデル操作 |
| **リポジトリの役割** | データアクセスのみ | データアクセス + 型変換（DB型 ⇔ ドメインモデル） |

### 設計の改善点

✅ **責任分離が明確**:
- ドメインモデル: ビジネスルールとバリデーション
- ユースケース: アプリケーション固有のフロー制御
- リポジトリ: データアクセスと型変換

✅ **テストしやすい**:
- ドメインモデルのテストは既に作成済み（Issue #22）
- ユースケースのテストはモックリポジトリで実施可能

✅ **不正な状態を持たない**:
- ドメインモデルのコンストラクタがprivate
- ファクトリメソッド（create, reconstruct）でのみ生成
- 常にバリデーション済みの状態を保証

---

## 🎯 設計方針（確定事項）

### 1. ユースケースの戻り値形式

**決定**: DTO（RecipeDto）を返す

**理由**:
- プレゼンテーション層に最適化されたデータ形式
- UI に必要なフィールドのみ公開
- ドメインモデルの内部構造を隠蔽できる
- レイヤー間の責任分離が明確

**実装**:
```typescript
// application/dto/RecipeDto.ts
export interface RecipeDto {
  id: string;
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
}

// ドメインモデル → DTO 変換
export function toRecipeDto(recipe: Recipe): RecipeDto {
  return {
    id: recipe.getId().getValue(),
    title: recipe.getTitle(),
    ingredients: recipe.getIngredients().map((i) => i.getValue()),
    steps_array: recipe.getSteps().map((s) => s.getDescription()),
    recipe_url: recipe.getRecipeUrl(),
    created_at: recipe.getCreatedAt().toISOString(),
  };
}
```

### 2. エラーハンドリング方針

**決定**: 例外をthrowする（ドメインモデルのバリデーションを活用）

**理由**:
- TypeScript の標準的なエラー処理
- 現在の App.tsx も try-catch で処理
- async/await との相性が良い
- UI でユーザーにエラーメッセージを表示しやすい
- **ドメインモデルが既にバリデーションロジックを持っている**

**バリデーション戦略**:
- **ドメインモデル（Recipe, Ingredient, CookingStep）がバリデーションを実行**
- ユースケース層は Value Object を生成してドメインモデルに渡すのみ
- 不正な値の場合、ドメインモデルが `Error` をthrow

**実装**:
```typescript
// ドメインモデルがバリデーションを実行
// Ingredient.create('') → Error: 'Ingredient cannot be empty'
// Recipe.create(title, [], steps) → Error: 'Recipe must have at least one ingredient'

// ユースケース内
const ingredients = request.ingredients.map((i) => Ingredient.create(i));
const steps = request.steps_array.map((s, idx) => CookingStep.create(idx + 1, s));
const recipe = Recipe.create(request.title, ingredients, steps, request.recipe_url);
// ↑ ここでバリデーションエラーが発生する可能性

// App.tsx で
try {
  await createRecipeUseCase.execute(request);
} catch (error) {
  alert(error.message || 'レシピの投稿に失敗しました');
}
```

**エラークラス階層**:
```
Error
├─ (ドメインモデルから) 'Ingredient cannot be empty'
├─ (ドメインモデルから) 'Recipe must have at least one ingredient'
├─ (ドメインモデルから) 'Title must be 100 characters or less'
└─ RepositoryError (データアクセスエラー)
```

**カスタムエラークラスは不要**:
- ドメインモデルが既に適切なメッセージで `Error` をthrow
- ValidationError 等のカスタムエラークラスは作成しない
- シンプルな設計を維持

### 3. トランザクション境界

**決定**: ユースケース層で管理

**理由**:
- ユースケース = ビジネストランザクションの単位
- 複数のリポジトリ操作をまとめて管理できる
- 将来の拡張に対応しやすい（例: レシピ作成 + タグ追加）

**実装方針**:
- 現時点では単一テーブル操作のみなので、Supabase の自動トランザクションで十分
- 将来的に複数テーブル操作が必要になった場合に備えて、ユースケース層にトランザクション境界を設定
- `// TODO: トランザクション管理が必要になった場合はここに実装` とコメントを残す

### 4. 検索ロジックの配置

**決定**: ユースケース層（SearchRecipesByIngredientsUseCase）

**理由**:
- 現在はクライアント側フィルタリング
- ユースケースとして実装すれば、将来サーバー側検索への移行が容易
- ビジネスロジック（AND/OR 検索、正規化）として明確に定義できる

**実装**:
- `src/lib/search.ts` の既存ロジックを `SearchRecipesByIngredientsUseCase` に移行
- `normalizeString()`, `matchIngredient()`, `filterRecipesByIngredients()` をユースケース内のプライベートメソッドとして実装
- 将来的にサーバー側検索に移行する場合は、リポジトリに `findByIngredients()` を追加し、ユースケース内で切り替える

### 5. リアルタイム更新の管理

**決定**: インフラ層（リポジトリ）で管理

**理由**:
- データアクセスの詳細として扱う
- ユースケース層は subscribe/unsubscribe のみを呼び出す
- データソースの実装詳細をユースケースから隠蔽できる

**実装方針**:
- `IRecipeRepository` に `subscribe(callback: () => void): () => void` メソッドを追加
- `SupabaseRecipeRepository` で Supabase Realtime の実装を隠蔽
- App.tsx の useEffect では、リポジトリの subscribe を呼び出すのみ
- 戻り値として unsubscribe 関数を返す

**コード例**:
```typescript
// domain/repositories/IRecipeRepository.ts
export interface IRecipeRepository {
  // 既存のメソッド...
  subscribe(onRecipeChange: () => void): () => void; // unsubscribe関数を返す
}

// infrastructure/repositories/SupabaseRecipeRepository.ts
subscribe(onRecipeChange: () => void): () => void {
  const channel = this.supabase
    .channel('recipes-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
      onRecipeChange();
    })
    .subscribe();

  return () => {
    this.supabase.removeChannel(channel);
  };
}

// App.tsx
useEffect(() => {
  const unsubscribe = recipeRepository.subscribe(() => {
    fetchRecipes();
  });

  return unsubscribe;
}, []);
```

---

## 🏗️ アーキテクチャ設計

### レイヤー構成

```
src/
├─ presentation/          (プレゼンテーション層)
│   └─ App.tsx            ← ユースケースを呼び出すのみ
│
├─ application/           (アプリケーション層) ★ 新規作成
│   ├─ usecases/          ← ビジネスロジック
│   │   ├─ CreateRecipeUseCase.ts
│   │   ├─ UpdateRecipeUseCase.ts
│   │   ├─ DeleteRecipeUseCase.ts
│   │   ├─ GetAllRecipesUseCase.ts
│   │   └─ SearchRecipesByIngredientsUseCase.ts
│   └─ dto/               ← データ転送オブジェクト
│       ├─ RecipeDto.ts
│       └─ CreateRecipeRequest.ts
│
├─ domain/                (ドメイン層)
│   └─ repositories/
│       └─ IRecipeRepository.ts ← subscribe() メソッドを追加
│
└─ infrastructure/        (インフラ層)
    └─ repositories/
        └─ SupabaseRecipeRepository.ts ← subscribe() を実装
```

### データフロー

#### 作成・更新・削除フロー
```
[App.tsx]
  ↓ CreateRecipeRequest
[CreateRecipeUseCase]
  ↓ CreateRecipeData (既存)
[SupabaseRecipeRepository]
  ↓ SQL
[Supabase]
  ↑ Recipe
[SupabaseRecipeRepository]
  ↑ Recipe
[CreateRecipeUseCase]
  ↓ RecipeDto (変換)
[App.tsx]
```

#### 検索フロー
```
[App.tsx]
  ↓ { searchTerms: string[], mode: 'and' | 'or' }
[SearchRecipesByIngredientsUseCase]
  ├─ GetAllRecipesUseCase.execute() でレシピ一覧取得
  └─ クライアント側フィルタリング実行
  ↓ RecipeDto[]
[App.tsx]
```

#### リアルタイム更新フロー
```
[Supabase Realtime]
  ↓ postgres_changes イベント
[SupabaseRecipeRepository.subscribe()]
  ↓ コールバック実行
[App.tsx useEffect]
  ↓ GetAllRecipesUseCase.execute() を呼び出し
[GetAllRecipesUseCase]
  ↓ RecipeDto[]
[App.tsx]
  └─ setRecipes() で状態更新
```

---

## 📝 実装ファイル一覧

### 新規作成ファイル（7ファイル）

#### 1. `src/application/dto/RecipeDto.ts`
プレゼンテーション層とのデータ転送用。

```typescript
export interface RecipeDto {
  id: string;
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
}

export function toRecipeDto(recipe: Recipe): RecipeDto {
  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps_array: recipe.steps_array,
    recipe_url: recipe.recipe_url,
    created_at: recipe.created_at,
  };
}
```

#### 2. `src/application/dto/CreateRecipeRequest.ts`
リクエストDTO（バリデーションはドメインモデルに委譲）。

```typescript
export interface CreateRecipeRequest {
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
}

// バリデーション関数は不要
// ドメインモデル（Recipe.create, Ingredient.create, CookingStep.create）が実行する
```

#### 3. `src/application/usecases/CreateRecipeUseCase.ts`
レシピ作成ユースケース（ドメインモデルを活用）。

```typescript
import { Recipe } from '../../domain/models/Recipe';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import { CreateRecipeRequest } from '../dto/CreateRecipeRequest';
import { RecipeDto, toRecipeDto } from '../dto/RecipeDto';

export class CreateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(request: CreateRecipeRequest): Promise<RecipeDto> {
    // Value Object を生成（バリデーションはドメインモデルが実行）
    const ingredients = request.ingredients.map((i) => Ingredient.create(i));
    const steps = request.steps_array.map((s, idx) => CookingStep.create(idx + 1, s));

    // ドメインモデル生成（バリデーションはRecipe.create内で実行）
    const recipe = Recipe.create(request.title, ingredients, steps, request.recipe_url);

    // リポジトリ経由で保存
    const savedRecipe = await this.recipeRepository.create(recipe);

    // DTOに変換して返す
    return toRecipeDto(savedRecipe);
  }
}
```

#### 4. `src/application/usecases/UpdateRecipeUseCase.ts`
レシピ更新ユースケース（ドメインモデルを活用）。

```typescript
import { RecipeId } from '../../domain/models/RecipeId';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';
import { Recipe } from '../../domain/models/Recipe';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import { CreateRecipeRequest } from '../dto/CreateRecipeRequest';
import { RecipeDto, toRecipeDto } from '../dto/RecipeDto';

export class UpdateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(id: string, request: CreateRecipeRequest): Promise<RecipeDto> {
    // RecipeId を生成
    const recipeId = RecipeId.create(id);

    // 存在確認
    const existingRecipe = await this.recipeRepository.findById(recipeId);
    if (!existingRecipe) {
      throw new Error(`レシピが見つかりません: ${id}`);
    }

    // Value Object を生成
    const ingredients = request.ingredients.map((i) => Ingredient.create(i));
    const steps = request.steps_array.map((s, idx) => CookingStep.create(idx + 1, s));

    // 新しいドメインモデルを再構築（createdAtは既存のものを使用）
    const updatedRecipe = Recipe.reconstruct(
      recipeId,
      request.title,
      ingredients,
      steps,
      request.recipe_url,
      existingRecipe.getCreatedAt()
    );

    // リポジトリ経由で保存
    const savedRecipe = await this.recipeRepository.update(updatedRecipe);

    return toRecipeDto(savedRecipe);
  }
}
```

#### 5. `src/application/usecases/DeleteRecipeUseCase.ts`
レシピ削除ユースケース（ドメインモデルを活用）。

```typescript
import { RecipeId } from '../../domain/models/RecipeId';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';

export class DeleteRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(id: string): Promise<void> {
    // RecipeId を生成
    const recipeId = RecipeId.create(id);

    // 存在確認
    const existingRecipe = await this.recipeRepository.findById(recipeId);
    if (!existingRecipe) {
      throw new Error(`レシピが見つかりません: ${id}`);
    }

    // 削除
    await this.recipeRepository.delete(recipeId);
  }
}
```

#### 6. `src/application/usecases/GetAllRecipesUseCase.ts`
レシピ一覧取得ユースケース。

```typescript
export class GetAllRecipesUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(): Promise<RecipeDto[]> {
    const recipes = await this.recipeRepository.findAll();
    return recipes.map(toRecipeDto);
  }
}
```

#### 7. `src/application/usecases/SearchRecipesByIngredientsUseCase.ts`
材料検索ユースケース（lib/search.ts の移行先）。

```typescript
export class SearchRecipesByIngredientsUseCase {
  constructor(
    private recipeRepository: IRecipeRepository,
    private getAllRecipesUseCase: GetAllRecipesUseCase
  ) {}

  async execute(
    searchTerms: string[],
    mode: 'and' | 'or' = 'or'
  ): Promise<RecipeDto[]> {
    // 全レシピ取得
    const allRecipes = await this.getAllRecipesUseCase.execute();

    // 検索語がない場合はそのまま返す
    if (searchTerms.length === 0) {
      return allRecipes;
    }

    // フィルタリング実行（既存のsearch.tsロジックを移行）
    return allRecipes.filter((recipe) => {
      const normalizedIngredients = recipe.ingredients.map((ing) =>
        this.normalizeString(ing)
      );

      if (mode === 'and') {
        return searchTerms.every((term) =>
          normalizedIngredients.some((ing) =>
            ing.includes(this.normalizeString(term))
          )
        );
      } else {
        return searchTerms.some((term) =>
          normalizedIngredients.some((ing) =>
            ing.includes(this.normalizeString(term))
          )
        );
      }
    });
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0)
      )
      .trim();
  }
}
```

### 修正ファイル（3ファイル）

#### 8. `src/domain/repositories/IRecipeRepository.ts`
**ドメインモデルを使用するように変更** + subscribe() メソッドを追加。

```typescript
import { Recipe } from '../models/Recipe';
import { RecipeId } from '../models/RecipeId';

export interface IRecipeRepository {
  findAll(): Promise<Recipe[]>; // ★ 戻り値をRecipeクラスに変更
  findById(id: RecipeId): Promise<Recipe | null>; // ★ 引数と戻り値を変更
  create(recipe: Recipe): Promise<Recipe>; // ★ 引数をRecipeクラスに変更
  update(recipe: Recipe): Promise<Recipe>; // ★ 引数をRecipeクラスに変更
  delete(id: RecipeId): Promise<void>; // ★ 引数をRecipeIdに変更
  subscribe(onRecipeChange: () => void): () => void; // ★ 追加
}

// CreateRecipeData, UpdateRecipeData は削除
// ドメインモデル（Recipe）を直接使用する
```

#### 9. `src/infrastructure/repositories/SupabaseRecipeRepository.ts`
**ドメインモデルとの変換処理を追加** + subscribe() を実装。

```typescript
import { Recipe } from '../../domain/models/Recipe';
import { RecipeId } from '../../domain/models/RecipeId';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import { Recipe as SupabaseRecipe } from '../../lib/supabase';

export class SupabaseRecipeRepository implements IRecipeRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(): Promise<Recipe[]> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(this.toDomainModel);
  }

  async findById(id: RecipeId): Promise<Recipe | null> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id.getValue())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(error.message);
    }
    return this.toDomainModel(data);
  }

  async create(recipe: Recipe): Promise<Recipe> {
    const dbData = this.toDatabase(recipe);
    const { data, error } = await this.supabase
      .from('recipes')
      .insert(dbData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.toDomainModel(data);
  }

  async update(recipe: Recipe): Promise<Recipe> {
    const dbData = this.toDatabase(recipe);
    const { data, error } = await this.supabase
      .from('recipes')
      .update(dbData)
      .eq('id', recipe.getId().getValue())
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.toDomainModel(data);
  }

  async delete(id: RecipeId): Promise<void> {
    const { error } = await this.supabase
      .from('recipes')
      .delete()
      .eq('id', id.getValue());

    if (error) throw new Error(error.message);
  }

  subscribe(onRecipeChange: () => void): () => void {
    const channel = this.supabase
      .channel('recipes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
        onRecipeChange();
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // データベース型 → ドメインモデル変換
  private toDomainModel(data: SupabaseRecipe): Recipe {
    return Recipe.reconstruct(
      RecipeId.create(data.id),
      data.title,
      data.ingredients.map((i) => Ingredient.create(i)),
      data.steps_array.map((s, idx) => CookingStep.create(idx + 1, s)),
      data.recipe_url,
      new Date(data.created_at)
    );
  }

  // ドメインモデル → データベース型変換
  private toDatabase(recipe: Recipe): Omit<SupabaseRecipe, 'created_at'> {
    return {
      id: recipe.getId().getValue(),
      title: recipe.getTitle(),
      ingredients: recipe.getIngredients().map((i) => i.getValue()),
      steps_array: recipe.getSteps().map((s) => s.getDescription()),
      recipe_url: recipe.getRecipeUrl(),
    };
  }
}
```

#### 10. `src/App.tsx`
ユースケースを使用するように変更。

**変更内容**:
- ユースケースのインスタンス化（L11-17）
- `fetchRecipes()` → `GetAllRecipesUseCase.execute()` に変更（L34-43）
- `handleCreateRecipe()` → `CreateRecipeUseCase.execute()` に変更（L48-59）
- `handleUpdateRecipe()` → `UpdateRecipeUseCase.execute()` に変更（L74-78）
- `handleDeleteRecipe()` → `DeleteRecipeUseCase.execute()` に変更（L104-114）
- `filterRecipesByIngredients()` → `SearchRecipesByIngredientsUseCase.execute()` に変更（L100-106）
- Realtime の subscribe をリポジトリ経由に変更（L22-27）

### 削除ファイル（1ファイル）

#### 11. `src/lib/search.ts`
SearchRecipesByIngredientsUseCase に統合されるため削除。

---

## 🔍 影響範囲分析

### デグレリスク

#### リスク1: リアルタイム更新の動作変更
**内容**: Realtime の subscribe をリポジトリ層に移動することで、動作が変わる可能性。

**対策**:
- リポジトリの subscribe() 実装は既存のコードをほぼそのまま移植
- App.tsx の useEffect のコールバックも fetchRecipes() を呼ぶだけなので変更最小限
- 動作確認を十分に実施

#### リスク2: 検索ロジックの移行ミス
**内容**: search.ts のロジックを SearchRecipesByIngredientsUseCase に移行する際のバグ。

**対策**:
- normalizeString(), matchIngredient(), filterRecipesByIngredients() をそのまま移植
- 既存のテストケース（もしあれば）を引き継ぐ
- 手動テストで検証（AND/OR 検索、全角半角、大文字小文字）

#### リスク3: エラーハンドリングの変更
**内容**: 例外クラスの導入により、エラーメッセージの表示が変わる可能性。

**対策**:
- 現在の alert() メッセージをそのまま維持
- ValidationError, RepositoryError を catch して適切に処理

### 破壊的変更

**なし**

- UI は変更なし
- 既存の Recipe 型を RecipeDto として再定義するのみ
- 内部構造のリファクタリングなので、外部への影響はゼロ

---

## ✅ 受け入れ条件

- [ ] 5つのユースケースクラスが実装されていること
  - CreateRecipeUseCase
  - UpdateRecipeUseCase
  - DeleteRecipeUseCase
  - GetAllRecipesUseCase
  - SearchRecipesByIngredientsUseCase

- [ ] 各ユースケースが単一責任を持つこと

- [ ] App.tsx のビジネスロジックがユースケースに移行されていること
  - ビジネスロジックは全てユースケースに移行
  - App.tsx はユースケースを呼び出すのみ

- [ ] ユースケースがリポジトリインターフェース経由でデータアクセスすること

- [ ] **IRecipeRepository がドメインモデル（Recipe, RecipeId）を使用していること**

- [ ] **SupabaseRecipeRepository がドメインモデルとDB型の変換を実装していること**
  - toDomainModel() メソッド
  - toDatabase() メソッド

- [ ] **ユースケースがドメインモデルのバリデーションを活用していること**
  - ValidationError等のカスタムエラークラスは不要
  - Ingredient.create(), CookingStep.create(), Recipe.create() がバリデーション

- [ ] DTOが適切に定義されていること
  - RecipeDto
  - CreateRecipeRequest

- [ ] 既存機能が正常に動作すること
  - レシピ作成・更新・削除
  - レシピ一覧表示
  - 材料検索（AND/OR）
  - リアルタイム更新

- [ ] IRecipeRepository に subscribe() メソッドが追加されていること

- [ ] SupabaseRecipeRepository で subscribe() が実装されていること

- [ ] App.tsx で Realtime がリポジトリ経由で管理されていること

- [ ] search.ts が削除されていること

- [ ] ユースケースの単体テストが作成されていること（任意）
  - 時間があれば作成
  - なければ後続のissueで対応

---

## 🧪 テスト計画

### 手動テスト項目

#### 1. レシピ作成
- [ ] 正常系: タイトル、材料、作り方を入力してレシピ作成
- [ ] 異常系: タイトルが空 → エラーメッセージ表示
- [ ] 異常系: 材料が空 → エラーメッセージ表示
- [ ] 異常系: 作り方が空 → エラーメッセージ表示

#### 2. レシピ更新
- [ ] 正常系: 既存レシピの内容を変更して更新
- [ ] 異常系: 存在しないIDで更新 → エラーメッセージ表示

#### 3. レシピ削除
- [ ] 正常系: レシピを削除
- [ ] 異常系: 存在しないIDで削除 → エラーメッセージ表示

#### 4. レシピ一覧取得
- [ ] 正常系: レシピ一覧が表示される
- [ ] 正常系: レシピが0件の場合 → 空メッセージ表示

#### 5. 材料検索
- [ ] 正常系: OR検索（複数キーワードのいずれかにヒット）
- [ ] 正常系: AND検索（複数キーワード全てにヒット）
- [ ] 正常系: 全角半角の正規化
- [ ] 正常系: 大文字小文字の正規化
- [ ] 異常系: 該当なし → 空メッセージ表示

#### 6. リアルタイム更新
- [ ] 正常系: 別タブでレシピ作成 → 自動的に一覧に反映
- [ ] 正常系: 別タブでレシピ削除 → 自動的に一覧から削除
- [ ] 正常系: 別タブでレシピ更新 → 自動的に一覧が更新

### 自動テスト（任意）

後続のissueで実装予定。

```typescript
// 例: CreateRecipeUseCase のテスト
describe('CreateRecipeUseCase', () => {
  it('正しいリクエストでレシピが作成される', async () => {
    const mockRepository = createMockRepository();
    const useCase = new CreateRecipeUseCase(mockRepository);

    const request: CreateRecipeRequest = {
      title: 'テストレシピ',
      ingredients: ['材料1', '材料2'],
      steps_array: ['手順1', '手順2'],
      recipe_url: null,
    };

    const result = await useCase.execute(request);

    expect(result.title).toBe('テストレシピ');
    expect(mockRepository.create).toHaveBeenCalledWith(request);
  });

  it('タイトルが空の場合はValidationErrorがthrowされる', async () => {
    const mockRepository = createMockRepository();
    const useCase = new CreateRecipeUseCase(mockRepository);

    const request: CreateRecipeRequest = {
      title: '',
      ingredients: ['材料1'],
      steps_array: ['手順1'],
      recipe_url: null,
    };

    await expect(useCase.execute(request)).rejects.toThrow(ValidationError);
  });
});
```

---

## 📅 実装スケジュール

### Phase 1: 基盤整備（1-2時間）
1. ~~エラークラスの作成~~ → 不要（ドメインモデルが Error をthrow）
2. DTOの作成（RecipeDto, CreateRecipeRequest）
3. IRecipeRepository を**ドメインモデル使用に変更** + subscribe() 追加

### Phase 2: ユースケース実装（2-3時間）
4. GetAllRecipesUseCase（最もシンプル、動作確認用）
5. CreateRecipeUseCase
6. UpdateRecipeUseCase
7. DeleteRecipeUseCase
8. SearchRecipesByIngredientsUseCase（search.ts から移行）

### Phase 3: インフラ層の修正（2-3時間）
9. SupabaseRecipeRepository を**ドメインモデル対応**に全面修正
   - toDomainModel() メソッド追加（データベース型 → ドメインモデル）
   - toDatabase() メソッド追加（ドメインモデル → データベース型）
   - findAll(), findById(), create(), update(), delete() を修正
   - subscribe() 実装

### Phase 4: プレゼンテーション層の修正（1-2時間）
10. App.tsx でユースケースを使用するように変更
11. search.ts の削除

### Phase 5: テスト・動作確認（1-2時間）
12. 手動テスト実施
13. デグレチェック
14. Vercel Preview環境で動作確認

**合計見積もり**: 7-11時間（Phase 3のリポジトリ修正が増加）

---

## 🚀 次のステップ

### 実装前の確認
- [x] 設計方針の確定
- [x] 要検討事項の議論
- [x] 設計ドキュメントの作成
- [ ] ユーザーによる設計レビュー・承認

### 実装開始
設計承認後、Developer Agent に以下を依頼：

```
Issue #23のユースケース層を実装してください。

設計ドキュメント: docs/issue-23-usecase-layer-design.md

実装フェーズ:
1. Phase 1: 基盤整備（エラークラス、DTO、IRecipeRepository拡張）
2. Phase 2: ユースケース実装（5つのユースケース）
3. Phase 3: インフラ層の修正（subscribe実装）
4. Phase 4: プレゼンテーション層の修正（App.tsx）
5. Phase 5: search.tsの削除

受け入れ条件を満たすように実装してください。
```

---

## 🔗 関連Issue

- **前提**: #21 (リポジトリパターン導入) ✅ 完了
- **前提**: #22 (ドメインモデル作成) - 現在作業中
- **次**: #24 (カスタムフック分離)

---

## 📚 参考資料

### クリーンアーキテクチャ
- ユースケース層 = アプリケーション層
- ドメイン層との境界を明確に
- インフラ層の詳細を隠蔽

### レイヤー依存関係
```
Presentation → Application → Domain ← Infrastructure
     ↑                                      ↓
     └──────────────────────────────────────┘
```

- Presentation層: Application層のユースケースを呼び出す
- Application層: Domain層のインターフェースに依存
- Infrastructure層: Domain層のインターフェースを実装
- Domain層: 他のレイヤーに依存しない（依存性逆転の原則）

---

## 備考

### ✅ Issue #22完了による設計の進化

**Issue #22が完了し、以下のドメインモデルが作成されました**:
- `Recipe` クラス（エンティティ）
- `RecipeId`, `Ingredient`, `CookingStep`（Value Objects）
- バリデーションロジック
- ファクトリメソッド（`create`, `reconstruct`）
- ユニットテスト

**この設計は当初の予想を上回る成果です**:
- 当初は「Issue #22完了後に対応」と予定していた
- しかし、Issue #23でリポジトリインターフェースの修正を含めることで、**完全なクリーンアーキテクチャ**を一気に実現できる
- ドメインモデルのバリデーションを活用することで、ユースケース層がよりシンプルになった

**技術的負債の解消**:
- `lib/supabase.ts` の `Recipe` 型依存を完全に排除
- データベース型とドメインモデルを明確に分離
- リポジトリが型変換の責任を持つ（Single Responsibility Principle）

### 今後の拡張予定

- [ ] サーバー側検索（Supabase Full-Text Search）
- [ ] ページネーション
- [ ] キャッシュ戦略
- [ ] 楽観的UI更新
- [ ] オフライン対応

---

**設計ドキュメント作成者**: Claude Code  
**レビュー待ち**: ユーザー承認
