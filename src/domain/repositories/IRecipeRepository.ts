import { Recipe } from '../../lib/supabase';

export type CreateRecipeData = {
  title: string;
  ingredients: string[];
  steps_array: string[];
  recipe_url: string | null;
};

export type UpdateRecipeData = CreateRecipeData;

export interface IRecipeRepository {
  findAll(): Promise<Recipe[]>;
  findById(id: string): Promise<Recipe | null>;
  create(data: CreateRecipeData): Promise<Recipe>;
  update(id: string, data: UpdateRecipeData): Promise<Recipe>;
  delete(id: string): Promise<void>;
}
