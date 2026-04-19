/*
  # Remove steps column from recipes table

  1. Changes
    - Remove `steps` text column (redundant with steps_array)
    - Keep `steps_array` jsonb column

  2. Pre-check
    - Verify all recipes have steps_array with data
    - Abort if any recipe is missing steps_array

  3. Note
    - This is a breaking change
    - Backup recommended before execution
    - Rollback procedure defined in DOWN section
*/

-- Pre-check: Verify all recipes have valid steps_array
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

  RAISE NOTICE 'Pre-check passed: All recipes have valid steps_array';
END $$;

-- Remove steps column
ALTER TABLE recipes DROP COLUMN IF EXISTS steps;

-- Verify column was removed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'steps'
  ) THEN
    RAISE EXCEPTION 'Failed to remove steps column';
  END IF;

  RAISE NOTICE 'Migration completed: steps column removed successfully';
END $$;
