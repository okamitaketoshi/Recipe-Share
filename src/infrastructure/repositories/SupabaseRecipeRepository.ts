import { SupabaseClient } from '@supabase/supabase-js';
import { Recipe } from '../../lib/supabase';
import {
  IRecipeRepository,
  CreateRecipeData,
  UpdateRecipeData,
} from '../../domain/repositories/IRecipeRepository';

export class SupabaseRecipeRepository implements IRecipeRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(): Promise<Recipe[]> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<Recipe | null> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  async create(recipeData: CreateRecipeData): Promise<Recipe> {
    const { data, error } = await this.supabase
      .from('recipes')
      .insert([
        {
          title: recipeData.title,
          ingredients: recipeData.ingredients,
          steps_array: recipeData.steps_array,
          recipe_url: recipeData.recipe_url,
          steps: recipeData.steps_array.join('\n'),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, recipeData: UpdateRecipeData): Promise<Recipe> {
    const { data, error } = await this.supabase
      .from('recipes')
      .update({
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        steps_array: recipeData.steps_array,
        recipe_url: recipeData.recipe_url,
        steps: recipeData.steps_array.join('\n'),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('recipes').delete().eq('id', id);

    if (error) throw error;
  }
}
