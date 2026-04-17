import { SupabaseClient } from '@supabase/supabase-js';
import { RecipeDTO } from '../dto/RecipeDTO';
import { Recipe } from '../../domain/models/Recipe';
import { RecipeId } from '../../domain/models/RecipeId';
import { Ingredient } from '../../domain/models/Ingredient';
import { CookingStep } from '../../domain/models/CookingStep';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';

export class SupabaseRecipeRepository implements IRecipeRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(): Promise<Recipe[]> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((item) => this.toDomainModel(item as RecipeDTO));
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
    return this.toDomainModel(data as RecipeDTO);
  }

  async create(recipe: Recipe): Promise<Recipe> {
    const dbData = this.toDatabase(recipe);
    const { data, error } = await this.supabase.from('recipes').insert([dbData]).select().single();

    if (error) throw new Error(error.message);
    return this.toDomainModel(data as RecipeDTO);
  }

  async update(recipe: Recipe): Promise<Recipe> {
    const dbData = this.toDatabase(recipe);
    const { data, error } = await this.supabase
      .from('recipes')
      .update(dbData)
      .eq('id', recipe.getId().getValue())
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.toDomainModel(data as RecipeDTO);
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

  // データベース型 → ドメインモデル変換
  private toDomainModel(data: RecipeDTO): Recipe {
    return Recipe.reconstruct(
      RecipeId.create(data.id),
      data.title,
      data.ingredients.map((i) => Ingredient.create(i)),
      data.steps_array.map((s, idx) => CookingStep.create(idx + 1, s)),
      data.recipe_url,
      new Date(data.created_at)
    );
  }

  // ドメインモデル → データベース型変換
  private toDatabase(recipe: Recipe): Omit<RecipeDTO, 'created_at'> {
    return {
      id: recipe.getId().getValue(),
      title: recipe.getTitle(),
      ingredients: recipe.getIngredients().map((i) => i.getValue()),
      steps_array: recipe.getSteps().map((s) => s.getDescription()),
      steps: recipe
        .getSteps()
        .map((s) => s.getDescription())
        .join('\n'),
      recipe_url: recipe.getRecipeUrl(),
    };
  }
}
