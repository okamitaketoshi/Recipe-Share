import { Recipe } from '../models/Recipe';
import { RecipeId } from '../models/RecipeId';

export interface IRecipeRepository {
  findAll(): Promise<Recipe[]>;
  findById(id: RecipeId): Promise<Recipe | null>;
  create(recipe: Recipe): Promise<Recipe>;
  update(recipe: Recipe): Promise<Recipe>;
  delete(id: RecipeId): Promise<void>;
  subscribe(onRecipeChange: () => void): () => void;
}
