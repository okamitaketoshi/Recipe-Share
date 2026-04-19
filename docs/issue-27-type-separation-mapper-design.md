# Issue #27: 型定義の分離とMapper作成 - 設計ドキュメント

## 📋 概要

DBスキーマ型とドメインモデルを完全に分離し、Mapperクラスで相互変換を行う構造に変更します。現在、部分的に実装されているMapper機構を整理し、一貫したアーキテクチャを確立します。

## 🎯 目的

- DBスキーマ型（DB層）とドメインモデル（Domain層）の完全な分離
- Mapperクラスの適切な配置とリポジトリでの活用
- 型名の明確化（RecipeDTO → RecipeRow）
- lib/supabase.tsからの型定義削除（責務の明確化）

## 🔍 現状分析

### 1. 現在のファイル構成

```
src/
├── lib/
│   └── supabase.ts                               # ⚠️ RecipeDTOをRecipeとして再export
├── domain/
│   └── models/
│       ├── Recipe.ts                             # ドメインモデル
│       ├── RecipeId.ts
│       ├── Ingredient.ts
│       └── CookingStep.ts
├── infrastructure/
│   ├── dto/
│   │   └── RecipeDTO.ts                          # ⚠️ DB型定義（名前が不適切）
│   └── repositories/
│       ├── RecipeMapper.ts                       # ⚠️ 配置場所が不適切
│       └── SupabaseRecipeRepository.ts           # ⚠️ Mapperを使わず独自実装
└── application/
    └── dto/
        └── RecipeDto.ts                          # Application層のDTO
```

### 2. 問題点の詳細

#### 問題1: Mapperの配置場所

**現状**: `infrastructure/repositories/RecipeMapper.ts`

**問題**:
- Mapperはリポジトリではない
- repositories配下に配置するのは不適切
- 他のMapperが追加された時にディレクトリ構造が分かりにくい

**Issue要求**: `infrastructure/mappers/RecipeMapper.ts`に移動

#### 問題2: DB型の名前と配置

**現状**: `infrastructure/dto/RecipeDTO.ts`

**問題**:
- DTOとDB型が混同されている（Application層にもRecipeDtoがある）
- DB型は「RecipeDTO」ではなく「RecipeRow」の方が適切
- Supabaseスキーマ型として明確に位置付けるべき

**Issue要求**: `infrastructure/supabase/schema.ts`に`RecipeRow`として定義

#### 問題3: Mapperが使われていない

**現状**: SupabaseRecipeRepositoryで独自に変換ロジックを実装

```typescript
// src/infrastructure/repositories/SupabaseRecipeRepository.ts
private toDomainModel(data: RecipeDTO): Recipe {
  return Recipe.reconstruct(
    RecipeId.create(data.id),
    data.title,
    data.ingredients.map((i) => Ingredient.create(i)),
    data.steps_array.map((s, idx) => CookingStep.create(idx + 1, s)),
    data.recipe_url,
    new Date(data.created_at)
  );
}

private toDatabase(recipe: Recipe): Omit<RecipeDTO, 'created_at'> {
  return {
    id: recipe.getId().getValue(),
    title: recipe.getTitle(),
    ingredients: recipe.getIngredients().map((i) => i.getValue()),
    steps_array: recipe.getSteps().map((s) => s.getDescription()),
    recipe_url: recipe.getRecipeUrl(),
  };
}
```

**問題**:
- RecipeMapperクラスが既に存在するのに使われていない
- 変換ロジックが重複している
- 保守性が低い（Mapper更新時に複数箇所を修正）

**Issue要求**: RecipeMapperクラスを使用

#### 問題4: lib/supabase.tsの型export

**現状**: `lib/supabase.ts`の23行目

```typescript
export type { RecipeDTO as Recipe } from '../infrastructure/dto/RecipeDTO';
```

**問題**:
- RecipeDTOをRecipeとして再exportしている
- ドメインモデルのRecipeと名前が衝突する可能性
- supabase.tsの責務はSupabaseクライアントのexportのみであるべき

**Issue要求**: 型定義削除

### 3. 変換ロジックの比較

SupabaseRecipeRepositoryの変換ロジックとRecipeMapperのロジックを比較した結果、**実質的に同じ**であることを確認しました。

| 項目 | SupabaseRecipeRepository | RecipeMapper |
|------|-------------------------|--------------|
| DB → ドメイン変換 | `toDomainModel(data)` | `toDomain(dto)` |
| ドメイン → DB変換 | `toDatabase(recipe)` | `toDTO(recipe)` |
| ロジック | 同一（変数名のみ異なる） | 同一 |

**結論**: SupabaseRecipeRepositoryの変換ロジックをRecipeMapperに置き換えても、**デグレの心配はありません**。

### 4. lib/supabase.ts型exportの使用状況

`lib/supabase`から`Recipe`型をimportしている箇所を調査した結果：

```bash
grep -rn "import.*Recipe.*from.*lib/supabase" src/
# 結果: 0件（実コードでは使われていない）
```

**結論**: `lib/supabase.ts`の型exportを削除しても、**実コードへの影響はありません**。

## 🏗️ 設計方針

### 変更内容の全体像

```
変更前:
src/infrastructure/
├── dto/
│   └── RecipeDTO.ts          → 削除
└── repositories/
    ├── RecipeMapper.ts        → 移動
    └── SupabaseRecipeRepository.ts  → 変換ロジック削除

変更後:
src/infrastructure/
├── supabase/
│   └── schema.ts              → 新規作成（RecipeRow定義）
├── mappers/
│   └── RecipeMapper.ts        → 移動（toDomain/toRowに名前変更）
└── repositories/
    └── SupabaseRecipeRepository.ts  → Mapperを使用
```

### 実装する変更

#### 変更1: DBスキーマ型の定義

**新規作成**: `src/infrastructure/supabase/schema.ts`

```typescript
/**
 * Supabaseから取得する生のデータ型定義
 * DBカラム名そのまま（snake_case）
 */
export type RecipeRow = {
  id: string;
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
```

**特徴**:
- DBカラム名そのまま（snake_case）
- Supabaseから取得する生のデータ型
- ドメインモデルとは独立

#### 変更2: Mapperの移動と名前変更

**移動元**: `src/infrastructure/repositories/RecipeMapper.ts`  
**移動先**: `src/infrastructure/mappers/RecipeMapper.ts`

**名前変更**:
- `toDomain(dto: RecipeDTO)` → `toDomain(row: RecipeRow)`
- `toDTO(recipe: Recipe)` → `toRow(recipe: Recipe)`

```typescript
import { RecipeRow } from '../supabase/schema';
import { Recipe } from '../../domain/models/Recipe';
import { RecipeId } from '../../domain/models/RecipeId';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';

/**
 * RecipeRow ⇔ Recipe（ドメインモデル）変換
 */
export class RecipeMapper {
  /**
   * RecipeRow → Recipe（ドメインモデル）変換
   */
  static toDomain(row: RecipeRow): Recipe {
    const id = RecipeId.create(row.id);
    const ingredients = row.ingredients.map((i) => Ingredient.create(i));
    const steps = row.steps_array.map((s, index) => CookingStep.create(index + 1, s));

    return Recipe.reconstruct(
      id,
      row.title,
      ingredients,
      steps,
      row.recipe_url,
      new Date(row.created_at)
    );
  }

  /**
   * Recipe（ドメインモデル）→ RecipeRow変換
   */
  static toRow(recipe: Recipe): Omit<RecipeRow, 'id' | 'created_at'> {
    const ingredients = recipe.getIngredients().map((i) => i.getValue());
    const steps = recipe.getSteps().map((s) => s.getDescription());

    return {
      title: recipe.getTitle(),
      ingredients,
      steps_array: steps,
      recipe_url: recipe.getRecipeUrl(),
    };
  }
}
```

**変更点**:
- `RecipeDTO` → `RecipeRow`に統一
- `toDTO()` → `toRow()`に名前変更（DBレコードであることを明確化）
- importパスを`../supabase/schema`に変更

#### 変更3: SupabaseRecipeRepositoryの修正

**修正**: `src/infrastructure/repositories/SupabaseRecipeRepository.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { RecipeRow } from '../supabase/schema';  // 変更
import { RecipeMapper } from '../mappers/RecipeMapper';  // 変更
import { Recipe } from '../../domain/models/Recipe';
import { RecipeId } from '../../domain/models/RecipeId';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';

export class SupabaseRecipeRepository implements IRecipeRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(): Promise<Recipe[]> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((item) => RecipeMapper.toDomain(item as RecipeRow));  // 変更
  }

  async findById(id: RecipeId): Promise<Recipe | null> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id.getValue())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return RecipeMapper.toDomain(data as RecipeRow);  // 変更
  }

  async create(recipe: Recipe): Promise<Recipe> {
    const dbData = {
      id: recipe.getId().getValue(),
      ...RecipeMapper.toRow(recipe),  // 変更
    };
    const { data, error } = await this.supabase.from('recipes').insert([dbData]).select().single();

    if (error) throw new Error(error.message);
    return RecipeMapper.toDomain(data as RecipeRow);  // 変更
  }

  async update(recipe: Recipe): Promise<Recipe> {
    const dbData = RecipeMapper.toRow(recipe);  // 変更
    const { data, error } = await this.supabase
      .from('recipes')
      .update(dbData)
      .eq('id', recipe.getId().getValue())
      .select()
      .single();

    if (error) throw new Error(error.message);
    return RecipeMapper.toDomain(data as RecipeRow);  // 変更
  }

  async delete(id: RecipeId): Promise<void> {
    const { error } = await this.supabase.from('recipes').delete().eq('id', id.getValue());

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

  // toDomainModel()とtoDatabase()メソッドを削除
}
```

**変更点**:
- `RecipeDTO` → `RecipeRow`に統一
- `RecipeMapper`を使用（private変換メソッド削除）
- importパスを`../mappers/RecipeMapper`と`../supabase/schema`に変更

#### 変更4: lib/supabase.tsの型削除

**修正**: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 環境変数の検証
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n\n` +
      'Please set the following environment variables:\n' +
      '1. For local development: Create .env.local file (see .env.local.example)\n' +
      '2. For Vercel deployment: Set environment variables in Vercel dashboard or CLI\n' +
      '   See docs/vercel-env-setup-guide.md for setup instructions'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 以下の行を削除:
// export type { RecipeDTO as Recipe } from '../infrastructure/dto/RecipeDTO';
```

**変更点**:
- 型定義のre-exportを削除
- supabaseクライアントのexportのみ残す

#### 変更5: RecipeDTO.tsの削除

**削除**: `src/infrastructure/dto/RecipeDTO.ts`

**理由**:
- `infrastructure/supabase/schema.ts`に`RecipeRow`として再定義
- 旧ファイルは不要

## ⚠️ デグレリスク・破壊的変更

### リスク1: Mapperロジックの変更

**影響**: RecipeMapper使用時に変換エラーが発生する可能性

**リスク評価**: 🟢 **低リスク**

**根拠**:
- SupabaseRecipeRepositoryの変換ロジックとRecipeMapperのロジックは実質的に同じ
- 単体テストで変換ロジックを検証済み

**対策**:
- 既存の単体テストを実行してデグレがないか確認
- 統合テストでCRUD操作を確認

### リスク2: lib/supabase.ts型exportの削除

**影響**: `lib/supabase`から`Recipe`型をimportしているコードが壊れる可能性

**リスク評価**: 🟢 **低リスク**

**根拠**:
- 調査の結果、実コードでは使用されていない
- ドキュメントファイル（design.md）でのみ参照されている

**対策**:
- TypeScriptビルドエラーをチェック
- grepで`import.*Recipe.*from.*lib/supabase`を検索して影響範囲を確認

### リスク3: importパスの変更

**影響**: SupabaseRecipeRepositoryのimportパスが変更される

**リスク評価**: 🟢 **低リスク**

**根拠**:
- SupabaseRecipeRepositoryのみが影響を受ける
- TypeScriptコンパイラがエラーを検出

**対策**:
- TypeScriptビルドエラーをチェック
- ESLintでimportパスの問題を検出

### リスク4: RecipeDTO → RecipeRowの名前変更

**影響**: RecipeDTOを参照しているコードが壊れる可能性

**リスク評価**: 🟢 **低リスク**

**根拠**:
- RecipeDTOはinfrastructure層内でのみ使用されている
- 外部からの参照はない

**対策**:
- TypeScriptビルドエラーをチェック
- grepで`RecipeDTO`を検索して影響範囲を確認

## 🤔 要検討事項

### 1. Mapperのエラーハンドリング

**現状**: Mapperは変換時にエラーをthrowしない

**質問**:
- 不正なデータ形式の場合、どのように処理すべきか？
  - **選択肢A**: 例外をthrowする（現状）
  - **選択肢B**: デフォルト値を使用する
  - **選択肢C**: Result型で成功/失敗を返す

**推奨**: 選択肢A（例外をthrow）

**理由**:
- ドメインモデルのコンストラクタで既にバリデーションを実施
- 不正なデータが来ることは想定外（DB整合性が保たれている前提）
- Result型の導入は大掛かりな変更になる

---

### 2. 日付型の扱い

**現状**: `created_at`はstring型で取得し、`new Date()`で変換

**質問**:
- string vs Date オブジェクトのどちらで扱うか？
- タイムゾーン考慮の必要性は？

**推奨**: 現状維持（stringで取得、Dateに変換）

**理由**:
- Supabaseはtimestamptzをstring（ISO 8601）で返す
- Dateオブジェクトに変換することで、ドメインモデルで日付操作が容易
- タイムゾーンはブラウザのローカルタイムで表示（現状で問題なし）

---

### 3. nullableフィールドの変換ロジック

**現状**: `recipe_url`がnullの場合、そのままnullで返す

**質問**:
- recipe_urlがnullの場合の処理は適切か？
- 空文字列に変換すべきか？

**推奨**: 現状維持（null許容）

**理由**:
- DBスキーマで`recipe_url`はnullable
- ドメインモデルのRecipeでもnull許容
- 空文字列に変換する必要性がない

---

### 4. Mapper層でのバリデーション要否

**現状**: Mapperではバリデーションを実施せず、ドメインモデルのコンストラクタに任せる

**質問**:
- Mapper層でバリデーションを実施すべきか？
  - **選択肢A**: ドメインモデルのコンストラクタで実施（現状）
  - **選択肢B**: Mapperで事前チェック

**推奨**: 選択肢A（ドメインモデルで実施）

**理由**:
- バリデーションはドメインモデルの責務
- Mapperは単純な変換のみを担当すべき
- 二重バリデーションは冗長

---

### 5. 他のエンティティ（Ingredientテーブル等）のMapper作成

**現状**: Recipeのみ対象

**質問**:
- 将来的にIngredientsテーブル、CookingStepsテーブルを分離した場合、それぞれのMapperを作成すべきか？

**推奨**: 必要に応じて作成

**理由**:
- 現状はRecipeのみで十分
- テーブル分離時に改めて設計

---

## 📂 ファイル構成（変更後）

```
src/
├── lib/
│   └── supabase.ts                       # Supabaseクライアントのみexport
├── domain/
│   └── models/
│       ├── Recipe.ts
│       ├── RecipeId.ts
│       ├── Ingredient.ts
│       └── CookingStep.ts
├── infrastructure/
│   ├── supabase/
│   │   └── schema.ts                     # ✨ 新規作成: RecipeRow定義
│   ├── mappers/
│   │   └── RecipeMapper.ts               # 📦 移動: RecipeRow ⇔ Recipe変換
│   └── repositories/
│       └── SupabaseRecipeRepository.ts   # ♻️ 修正: Mapperを使用
└── application/
    └── dto/
        └── RecipeDto.ts                  # Application層のDTO（変更なし）
```

## 📝 実装順序

### Phase 1: schema.ts作成

1. `src/infrastructure/supabase/schema.ts`を作成
2. `RecipeRow`型を定義

### Phase 2: Mapper移動と修正

1. `src/infrastructure/mappers/`ディレクトリを作成
2. `RecipeMapper.ts`を`repositories/`から`mappers/`に移動
3. importパスを修正
4. `RecipeDTO` → `RecipeRow`に名前変更
5. `toDTO()` → `toRow()`に名前変更

### Phase 3: SupabaseRecipeRepository修正

1. importパスを修正（`../mappers/RecipeMapper`と`../supabase/schema`）
2. `RecipeMapper.toDomain()`と`RecipeMapper.toRow()`を使用
3. private変換メソッド（`toDomainModel()`と`toDatabase()`）を削除

### Phase 4: lib/supabase.ts修正

1. 型定義のre-export（23行目）を削除

### Phase 5: RecipeDTO.ts削除

1. `src/infrastructure/dto/RecipeDTO.ts`を削除

### Phase 6: TypeScriptビルド確認

```bash
npm run typecheck
npm run build
```

### Phase 7: ESLint確認

```bash
npm run lint
```

### Phase 8: 単体テスト実行

```bash
npm run test
```

### Phase 9: 統合テスト（手動）

```bash
npm run dev
```

以下を確認:
- レシピ一覧表示
- レシピ作成
- レシピ編集
- レシピ削除
- Realtime更新

## ✅ 受け入れ条件

- [ ] `infrastructure/supabase/schema.ts`でRecipeRow型が定義されていること
- [ ] `infrastructure/mappers/RecipeMapper.ts`が作成されていること
  - `toDomain(row: RecipeRow): Recipe`が実装されていること
  - `toRow(recipe: Recipe): Omit<RecipeRow, 'id' | 'created_at'>`が実装されていること
- [ ] `SupabaseRecipeRepository`がRecipeMapperを使用していること
  - `RecipeMapper.toDomain()`を使用
  - `RecipeMapper.toRow()`を使用
  - private変換メソッドが削除されていること
- [ ] `lib/supabase.ts`から型定義が削除されていること
  - 23行目の`export type { RecipeDTO as Recipe }`が削除されていること
- [ ] `infrastructure/dto/RecipeDTO.ts`が削除されていること
- [ ] 既存機能が正常に動作すること
  - レシピ一覧表示
  - レシピ作成
  - レシピ編集
  - レシピ削除
  - Realtime更新
- [ ] TypeScriptビルドエラー: 0件
- [ ] ESLintエラー: 0件
- [ ] 単体テストが成功すること

## 🧪 テスト計画

### 1. TypeScript型チェック

```bash
npm run typecheck
```

**期待結果**: エラー0件

### 2. ESLintチェック

```bash
npm run lint
```

**期待結果**: エラー0件

### 3. 単体テスト

```bash
npm run test
```

**対象**:
- RecipeMapperのテスト（既存）
- ドメインモデルのテスト（既存）

**期待結果**: 全てのテストが成功

### 4. 統合テスト（手動）

**テストケース**:

1. **レシピ一覧表示**
   - [ ] レシピ一覧が正常に表示される
   - [ ] 手順が正しく表示される（steps_array）

2. **レシピ作成**
   - [ ] 新規レシピが作成できる
   - [ ] 作成後、レシピ一覧に追加される

3. **レシピ編集**
   - [ ] 既存レシピを編集できる
   - [ ] 編集後、変更が反映される

4. **レシピ削除**
   - [ ] レシピを削除できる
   - [ ] 削除後、レシピ一覧から消える

5. **Realtime更新**
   - [ ] 別のクライアントでレシピを作成/編集/削除した時、自動的に反映される

## 💬 確認事項

以下の点についてユーザーに確認が必要です：

1. **設計方針**: RecipeDTO → RecipeRowへの名前変更とディレクトリ構造の変更で問題ないか？
2. **要検討事項**: 上記5点について判断・方針決定
   - Mapperのエラーハンドリング → 推奨: 例外をthrow（現状維持）
   - 日付型の扱い → 推奨: stringで取得、Dateに変換（現状維持）
   - nullableフィールドの変換ロジック → 推奨: null許容（現状維持）
   - Mapper層でのバリデーション要否 → 推奨: ドメインモデルで実施（現状維持）
   - 他のエンティティのMapper作成 → 推奨: 必要に応じて作成
3. **実装開始の承認**: Developer Agentを起動して実装開始してよいか？

---

## 🚀 次のステップ

ユーザー承認後、Developer Agentを起動して以下を実装します：

1. schema.ts作成（RecipeRow定義）
2. RecipeMapper移動と修正
3. SupabaseRecipeRepository修正（Mapper使用）
4. lib/supabase.ts修正（型削除）
5. RecipeDTO.ts削除
6. TypeScriptビルド・ESLint確認
7. 単体テスト実行
8. 統合テスト（手動）
