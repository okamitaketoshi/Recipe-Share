# Issue #26: DBスキーマの最適化 - 設計ドキュメント

## 概要

recipesテーブルの`steps`カラム（text型）を削除し、`steps_array`（jsonb型）のみに統一してデータ重複を解消する。

## 現状分析

### 1. データベーススキーマ

**現在のrecipesテーブル**:
```sql
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps text NOT NULL,                    -- ⚠️ 削除対象
  steps_array jsonb DEFAULT '[]'::jsonb,  -- ✅ 残す
  recipe_url text,
  created_at timestamptz DEFAULT now()
);
```

**問題点**:
- `steps` (text): 改行区切りの手順テキスト
- `steps_array` (jsonb): 配列形式の手順
- **データ重複**: 両方に同じ情報が格納されている
- **保守性低下**: 更新時に両方のカラムを同期する必要がある

### 2. マイグレーション履歴

1. **20260310143236_create_recipes_table.sql**
   - `steps` (text)カラムを作成

2. **20260311065834_add_steps_and_url_to_recipes.sql**
   - `steps_array` (jsonb)カラムを追加
   - 後方互換性のため`steps`は残したまま

### 3. コード層での使用状況

#### アプリケーション層（Application Layer）
✅ **既に`steps_array`のみ使用**:
- `src/application/dto/RecipeDto.ts` - `steps_array`のみ
- `src/application/dto/CreateRecipeRequest.ts` - `steps_array`のみ
- `src/application/usecases/*` - `steps_array`のみ

#### プレゼンテーション層（Presentation Layer）
✅ **既に`steps_array`のみ使用**:
- `src/components/RecipeCard.tsx` (L61) - `recipe.steps_array`を使用
- `src/components/RecipeForm.tsx` - `steps_array`のみ

#### インフラストラクチャ層（Infrastructure Layer）
⚠️ **`steps`と`steps_array`の両方を使用**:
- `src/infrastructure/dto/RecipeDTO.ts` (L5-6)
  ```typescript
  export type RecipeDTO = {
    steps: string;        // ⚠️ 削除対象
    steps_array: string[];
  };
  ```

- `src/infrastructure/repositories/RecipeMapper.ts` (L41)
  ```typescript
  static toDTO(recipe: Recipe): Omit<RecipeDTO, 'id' | 'created_at'> {
    return {
      steps_array: steps,
      steps: steps.join('\n'),  // ⚠️ 削除対象
    };
  }
  ```

- `src/infrastructure/repositories/SupabaseRecipeRepository.ts` (L95-98)
  ```typescript
  private toDatabase(recipe: Recipe): Omit<RecipeDTO, 'created_at'> {
    return {
      steps_array: recipe.getSteps().map((s) => s.getDescription()),
      steps: recipe.getSteps().map((s) => s.getDescription()).join('\n'),  // ⚠️ 削除対象
    };
  }
  ```

## 設計方針

### 1. 破壊的変更の分析

**破壊的変更**: `recipes.steps`カラムを削除

**影響範囲**:
- ✅ **既存データ**: 影響なし（`steps_array`が既に存在）
- ✅ **アプリケーション層**: 影響なし（既に`steps_array`のみ使用）
- ⚠️ **インフラストラクチャ層**: 修正必要（`steps`フィールドを削除）
- ⚠️ **データベース**: カラム削除（ロールバック手順必須）

**リスク評価**:
- 🟢 **低リスク**: アプリケーション層は既に`steps_array`のみ使用
- 🟢 **低リスク**: データベースには`steps_array`が既に存在
- 🟡 **中リスク**: マイグレーション実行の不可逆性（ロールバック手順必須）

### 2. マイグレーション戦略

#### マイグレーションファイル構造

**ファイル名**: `YYYYMMDDHHMMSS_remove_steps_column.sql`

**UP（適用）処理**:
```sql
-- 1. 事前チェック: steps_arrayが全レコードに存在することを確認
DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM recipes
  WHERE steps_array IS NULL OR jsonb_array_length(steps_array) = 0;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Found % recipes with empty or null steps_array. Migration aborted.', missing_count;
  END IF;
END $$;

-- 2. stepsカラムを削除
ALTER TABLE recipes DROP COLUMN IF EXISTS steps;
```

**DOWN（ロールバック）処理**:
```sql
-- stepsカラムを復元（steps_arrayから生成）
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS steps text;

-- 既存データのstepsカラムを復元
UPDATE recipes
SET steps = (
  SELECT string_agg(value::text, E'\n' ORDER BY ordinality)
  FROM jsonb_array_elements_text(steps_array) WITH ORDINALITY
)
WHERE steps IS NULL;

-- NOT NULL制約を追加
ALTER TABLE recipes ALTER COLUMN steps SET NOT NULL;
```

#### 実行タイミング

1. **ローカル環境**: 開発中に実行・検証
2. **Preview環境**: PR作成時に自動実行
3. **本番環境**: PRマージ後、トラフィックが少ない時間帯に実行

### 3. コード修正方針

#### 修正ファイル一覧

1. **`src/infrastructure/dto/RecipeDTO.ts`**
   - `steps: string;`を削除
   - `steps_array`のみ残す

2. **`src/infrastructure/repositories/RecipeMapper.ts`**
   - `toDTO`メソッドから`steps: steps.join('\n')`を削除

3. **`src/infrastructure/repositories/SupabaseRecipeRepository.ts`**
   - `toDatabase`メソッドから`steps`フィールド生成を削除

4. **新規作成: `src/infrastructure/supabase/schema.ts`**（オプション）
   - Supabaseスキーマ型定義を追加（将来的な型安全性向上）

## 実装順序

### Phase 1: データ整合性確認（必須）✅ 完了

Supabase管理画面またはCLIで既存データを確認：

```sql
-- 1. 全レシピ数を確認
SELECT COUNT(*) FROM recipes;

-- 2. steps_arrayが空または欠損しているレコードを確認
SELECT id, title, steps_array
FROM recipes
WHERE steps_array IS NULL OR jsonb_array_length(steps_array) = 0;

-- 期待結果: 0件（欠損なし）
```

**✅ 確認結果（2026-04-19）**:
- `missing_steps_array_count = 0`
- 全レシピに`steps_array`が存在することを確認
- マイグレーション実行可能

### Phase 2: マイグレーションファイル作成

```bash
# Supabase CLIでマイグレーション作成
supabase migration new remove_steps_column

# ファイル編集: UP/DOWN処理を記述
```

### Phase 3: ローカル環境でテスト

```bash
# 1. ローカルSupabaseを起動
supabase start

# 2. マイグレーション適用
supabase db reset

# 3. 動作確認
# - レシピ一覧表示
# - レシピCRUD操作
# - steps_arrayが正しく表示されること

# 4. ロールバックテスト
supabase migration down
supabase migration up
```

### Phase 4: コード修正

1. **RecipeDTO.ts修正**
   - `steps`フィールド削除

2. **RecipeMapper.ts修正**
   - `steps: steps.join('\n')`削除

3. **SupabaseRecipeRepository.ts修正**
   - `toDatabase`メソッドから`steps`削除

4. **TypeScriptビルド確認**
   ```bash
   npm run build
   npm run typecheck
   ```

5. **ESLint確認**
   ```bash
   npm run lint
   ```

### Phase 5: 統合テスト

```bash
# 1. 開発サーバー起動
npm run dev

# 2. 動作確認
# - レシピ一覧表示
# - レシピ作成（新規）
# - レシピ編集
# - レシピ削除
# - Realtime更新
```

### Phase 6: PR作成

```bash
# 1. コミット作成
/create-commit

# 2. PR作成
/create-pr

# 3. Preview環境で確認
# - Supabaseマイグレーション自動適用
# - Vercel Preview環境でUI確認
```

## ロールバック手順

### ロールバック用SQLファイル

✅ **作成済み**: `supabase/migrations/20260419140125_remove_steps_column_rollback.sql`

このファイルには以下が含まれています：
- stepsカラムの復元
- steps_arrayからのデータ再生成
- NOT NULL制約の追加
- ロールバック検証

### シナリオ1: マイグレーション適用後、問題発見

**即座にロールバック**:

```bash
# Supabase管理画面のSQL Editorで実行
# ファイル: supabase/migrations/20260419140125_remove_steps_column_rollback.sql
```

または手動SQL:

```sql
-- stepsカラムを復元
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS steps text;

-- 既存データのstepsカラムを復元
UPDATE recipes
SET steps = (
  SELECT string_agg(value::text, E'\n' ORDER BY ordinality)
  FROM jsonb_array_elements_text(steps_array) WITH ORDINALITY
)
WHERE steps IS NULL;

-- NOT NULL制約を追加
ALTER TABLE recipes ALTER COLUMN steps SET NOT NULL;
```

**ロールバック後の必須手順**:
1. ✅ Gitで前のコミットに戻す
2. ✅ 修正前のコード（RecipeDTO、RecipeMapper、Repository）に戻す
3. ✅ 再デプロイ

### シナリオ2: コード修正後、デグレ発見

**コード修正のみロールバック**:

1. Gitで前のコミットに戻す
   ```bash
   git revert <commit-hash>
   ```

2. マイグレーションはそのまま（`steps_array`のみ使用を維持）

### シナリオ3: 本番環境でクリティカルな問題

**緊急ロールバック手順**:

1. **データベース復元**（バックアップから）
   ```bash
   # Supabase管理画面でバックアップから復元
   ```

2. **コードロールバック**
   ```bash
   git revert <commit-hash>
   git push origin develop
   ```

3. **Vercel再デプロイ**
   ```bash
   # Vercel管理画面で前のデプロイメントにロールバック
   ```

## テスト計画

### 1. マイグレーションテスト

- [ ] ローカル環境でマイグレーション適用成功
- [ ] `steps`カラムが削除されていること
- [ ] `steps_array`カラムが残っていること
- [ ] 既存レシピデータが正常に読み込めること
- [ ] ロールバック実行成功
- [ ] ロールバック後、`steps`カラムが復元されること

### 2. コードテスト

- [ ] TypeScriptビルドエラーがないこと
- [ ] ESLintエラーがないこと
- [ ] RecipeDTO型定義が正しいこと
- [ ] RecipeMapper.toDTOが`steps`なしで動作すること
- [ ] SupabaseRecipeRepository.toDatabaseが`steps`なしで動作すること

### 3. 統合テスト（UI）

- [ ] レシピ一覧が正常に表示されること
- [ ] レシピカードで手順が正しく表示されること
- [ ] 新規レシピ作成が成功すること
- [ ] レシピ編集が成功すること
- [ ] レシピ削除が成功すること
- [ ] Realtime更新が動作すること

### 4. Preview環境テスト

- [ ] Supabaseマイグレーションが自動適用されること
- [ ] Vercel Preview環境でUIが正常に動作すること
- [ ] 既存レシピが正常に表示されること
- [ ] CRUD操作が全て成功すること

## 受け入れ条件

- [x] マイグレーションファイルが作成されている
- [ ] ローカル環境でマイグレーション実行が成功する
- [x] RecipeDTO.tsから`steps`フィールドが削除されている
- [x] RecipeMapper.toDTOから`steps`生成が削除されている
- [x] SupabaseRecipeRepository.toDatabaseから`steps`生成が削除されている
- [ ] 既存レシピが正常に表示される
- [ ] 新規レシピ作成・更新が正常に動作する
- [x] ロールバック手順がドキュメント化されている
- [ ] TypeScriptビルドエラー: 0件
- [ ] ESLintエラー: 0件

## 注意事項

### ⚠️ 破壊的変更

このマイグレーションは**破壊的変更**です。以下の点に注意してください：

1. **バックアップ必須**: マイグレーション実行前に必ずバックアップを取得
2. **ロールバック手順確認**: 緊急時の復旧手順を事前に確認
3. **Preview環境で確認**: 本番適用前に必ずPreview環境で動作確認
4. **トラフィック考慮**: 本番環境ではトラフィックが少ない時間帯に実行

### 📊 データ整合性

- **前提条件**: 全レシピの`steps_array`が存在すること
- **検証方法**: Phase 1のSQL確認で欠損がないことを確認
- **対策**: 欠損が見つかった場合は、マイグレーション実行前に修正

### 🔄 ロールバック

- **タイミング**: 問題発見後、即座にロールバック
- **手順**: DOWN処理で`steps`カラムを復元
- **データ復元**: `steps_array`から`steps`を生成

## まとめ

この設計により、以下が実現されます：

1. ✅ データ重複の解消（`steps`カラム削除）
2. ✅ `steps_array`のみに統一
3. ✅ 保守性の向上（更新時の同期処理が不要）
4. ✅ ロールバック手順の明確化
5. ✅ アプリケーション層への影響最小化（既に`steps_array`のみ使用）

既存のUIと機能は完全に維持され、データベーススキーマのみ最適化されます。
