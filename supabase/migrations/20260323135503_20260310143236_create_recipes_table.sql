/*
  # Public Recipe Sharing App Schema

  1. New Tables
    - `recipes`
      - `id` (uuid, primary key) - Unique identifier for each recipe
      - `title` (text, not null) - Recipe title
      - `ingredients` (jsonb, not null) - Array of ingredients stored as JSON
      - `steps` (text, not null) - Cooking instructions
      - `created_at` (timestamptz) - Timestamp of recipe creation

  2. Security
    - Enable RLS on `recipes` table
    - Add policies to allow all users (authenticated and anonymous) to:
      - View all recipes (SELECT)
      - Create new recipes (INSERT)
      - Update any recipe (UPDATE)
      - Delete any recipe (DELETE)
    
  Note: This is a public app with no authentication required.
  All operations are open to everyone.
*/

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view recipes"
  ON recipes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create recipes"
  ON recipes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update recipes"
  ON recipes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete recipes"
  ON recipes FOR DELETE
  TO anon, authenticated
  USING (true);
