-- データ整合性確認用SQLスクリプト
-- Issue #26: DBスキーマの最適化

-- ==========================================
-- 1. 全レシピ数を確認
-- ==========================================
SELECT
  COUNT(*) as total_recipes,
  'Total number of recipes' as description
FROM recipes;

-- ==========================================
-- 2. steps_arrayが空または欠損しているレコードを確認
-- ==========================================
SELECT
  COUNT(*) as missing_steps_array_count,
  'Recipes with empty or missing steps_array' as description
FROM recipes
WHERE steps_array IS NULL
   OR jsonb_array_length(steps_array) = 0;

-- 期待結果: 0件（欠損なし）
-- もし1件以上見つかった場合は、マイグレーション実行前に修正が必要

-- ==========================================
-- 3. 欠損しているレシピの詳細（該当する場合）
-- ==========================================
SELECT
  id,
  title,
  steps,
  steps_array,
  created_at
FROM recipes
WHERE steps_array IS NULL
   OR jsonb_array_length(steps_array) = 0
ORDER BY created_at DESC
LIMIT 10;

-- ==========================================
-- 4. stepsとsteps_arrayの整合性確認
-- ==========================================
-- stepsカラムが存在し、steps_arrayも存在するレコード数
SELECT
  COUNT(*) as both_exist_count,
  'Recipes with both steps and steps_array' as description
FROM recipes
WHERE steps IS NOT NULL
  AND steps_array IS NOT NULL
  AND jsonb_array_length(steps_array) > 0;

-- ==========================================
-- 5. サンプルデータ確認（最新5件）
-- ==========================================
SELECT
  id,
  title,
  LEFT(steps, 50) as steps_preview,
  jsonb_array_length(steps_array) as steps_array_length,
  steps_array,
  created_at
FROM recipes
ORDER BY created_at DESC
LIMIT 5;

-- ==========================================
-- 実行方法
-- ==========================================
-- 1. Supabase管理画面にアクセス
--    https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
--
-- 2. SQL Editorで上記クエリを実行
--
-- 3. 結果を確認
--    - total_recipes: 全レシピ数
--    - missing_steps_array_count: 0であることを確認
--    - もし0でない場合は、該当レシピの詳細を確認して修正
--
-- 4. 問題がなければ、マイグレーション実行可能

-- ==========================================
-- 注意事項
-- ==========================================
-- - このスクリプトは読み取り専用（SELECT）のみです
-- - データベースに変更を加えることはありません
-- - 安全に実行できます
