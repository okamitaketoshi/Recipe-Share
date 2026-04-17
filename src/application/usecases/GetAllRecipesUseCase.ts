import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository';
import { RecipeDto, toRecipeDto } from '../dto/RecipeDto';

export class GetAllRecipesUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  async execute(): Promise<RecipeDto[]> {
    const recipes = await this.recipeRepository.findAll();
    return recipes.map(toRecipeDto);
  }
}
