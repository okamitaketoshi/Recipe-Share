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

export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string;
  steps_array: string[];
  recipe_url: string | null;
  created_at: string;
};
