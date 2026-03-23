/*
  # Add steps array and recipe URL to recipes table

  1. Changes
    - Add `steps_array` column as jsonb array (individual steps)
    - Add `recipe_url` column as text (optional recipe reference URL)
    - Keep `steps` text column for backward compatibility with existing data

  2. Note
    - Existing recipes with text `steps` will be migrated to array format
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'steps_array'
  ) THEN
    ALTER TABLE recipes ADD COLUMN steps_array jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'recipe_url'
  ) THEN
    ALTER TABLE recipes ADD COLUMN recipe_url text;
  END IF;
END $$;
