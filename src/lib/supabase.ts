import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string;
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
