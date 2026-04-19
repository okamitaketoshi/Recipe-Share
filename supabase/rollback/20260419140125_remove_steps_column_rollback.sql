/*
  # Rollback: Restore steps column from steps_array

  ⚠️ 緊急ロールバック用SQLスクリプト

  1. Purpose
    - マイグレーション20260419140125_remove_steps_column.sqlのロールバック
    - stepsカラムを復元し、steps_arrayから値を再生成

  2. When to use
    - マイグレーション適用後に問題が発生した場合
    - 本番環境で予期しないエラーが発生した場合

  3. Execution
    - Supabase管理画面のSQL Editorで実行
    - またはSupabase CLIで実行: supabase db execute --file <this-file>

  4. Note
    - このスクリプトは手動実行用です
    - 実行前に必ずバックアップを取得してください
    - 実行後、アプリケーションコードも元に戻す必要があります
*/

-- Step 1: Add steps column back
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS steps text;

-- Step 2: Restore steps data from steps_array
UPDATE recipes
SET steps = (
  SELECT string_agg(value::text, E'\n' ORDER BY ordinality)
  FROM jsonb_array_elements_text(steps_array) WITH ORDINALITY
)
WHERE steps IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE recipes ALTER COLUMN steps SET NOT NULL;

-- Step 4: Verify rollback
DO $$
DECLARE
  null_count integer;
  total_count integer;
BEGIN
  -- Check for null values
  SELECT COUNT(*) INTO null_count
  FROM recipes
  WHERE steps IS NULL;

  -- Get total count
  SELECT COUNT(*) INTO total_count
  FROM recipes;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Rollback incomplete: % out of % recipes have null steps', null_count, total_count;
  END IF;

  RAISE NOTICE 'Rollback completed successfully: % recipes with steps column restored', total_count;
END $$;

-- Step 5: Verify column structure
DO $$
BEGIN
  -- Check if steps column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'steps'
  ) THEN
    RAISE EXCEPTION 'Rollback failed: steps column does not exist';
  END IF;

  -- Check if steps_array column still exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'steps_array'
  ) THEN
    RAISE EXCEPTION 'Critical error: steps_array column is missing';
  END IF;

  RAISE NOTICE 'Column structure verified: Both steps and steps_array columns exist';
END $$;

/*
  実行後の確認SQL:

  -- 1. カラム構造確認
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'recipes' AND column_name IN ('steps', 'steps_array')
  ORDER BY column_name;

  -- 期待される結果:
  -- steps       | text  | NO
  -- steps_array | jsonb | YES

  -- 2. データ確認（サンプル5件）
  SELECT
    id,
    title,
    LEFT(steps, 50) as steps_preview,
    jsonb_array_length(steps_array) as steps_array_length
  FROM recipes
  ORDER BY created_at DESC
  LIMIT 5;

  -- 3. ロールバック後のアクション
  -- ✅ アプリケーションコードを元のコミットに戻す
  -- ✅ 修正前のRecipeDTO、RecipeMapper、SupabaseRecipeRepositoryに戻す
  -- ✅ 再デプロイ
*/
