import { SupabaseClient } from '@supabase/supabase-js';
import { RecipeRow } from '../supabase/schema';
import { RecipeMapper } from '../mappers/RecipeMapper';
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
    return (data || []).map((item) => RecipeMapper.toDomain(item as RecipeRow));
  }

  async findById(id: RecipeId): Promise<Recipe | null> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id.getValue())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(error.message);
    }
    return RecipeMapper.toDomain(data as RecipeRow);
  }

  async create(recipe: Recipe): Promise<Recipe> {
    const dbData = {
      id: recipe.getId().getValue(),
      ...RecipeMapper.toRow(recipe),
    };
    const { data, error } = await this.supabase.from('recipes').insert([dbData]).select().single();

    if (error) throw new Error(error.message);
    return RecipeMapper.toDomain(data as RecipeRow);
  }

  async update(recipe: Recipe): Promise<Recipe> {
    const dbData = RecipeMapper.toRow(recipe);
    const { data, error } = await this.supabase
      .from('recipes')
      .update(dbData)
      .eq('id', recipe.getId().getValue())
      .select()
      .single();

    if (error) throw new Error(error.message);
    return RecipeMapper.toDomain(data as RecipeRow);
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
}
