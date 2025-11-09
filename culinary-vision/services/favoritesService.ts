// Favorites service to manage user's favorite recipes

import type { Recipe, Storyboard } from '../types';

export interface FavoriteRecipe {
  id: string; // Unique ID for this favorite
  recipe: Recipe;
  storyboard?: Storyboard;
  videoUrls?: string[];
  voiceoverUrl?: string;
  createdAt: Date;
  ingredients: string[];
}

const FAVORITES_KEY_PREFIX = 'culinary_vision_favorites_';

export const favoritesService = {
  // Get storage key for current user
  getStorageKey(): string {
    const user = this.getUserId();
    return `${FAVORITES_KEY_PREFIX}${user}`;
  },

  // Get current user ID from auth service
  getUserId(): string {
    try {
      // Check localStorage directly to avoid circular dependency
      const storedUser = localStorage.getItem('culinary_vision_user');
      const sessionToken = localStorage.getItem('culinary_vision_session');
      
      if (storedUser && sessionToken) {
        try {
          const user = JSON.parse(storedUser);
          return user.id || 'guest';
        } catch (e) {
          return 'guest';
        }
      }
      return 'guest';
    } catch (e) {
      return 'guest';
    }
  },

  // Get all favorites for current user
  getFavorites(): FavoriteRecipe[] {
    const key = this.getStorageKey();
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const favorites: FavoriteRecipe[] = JSON.parse(stored);
        // Restore date objects
        return favorites.map(fav => ({
          ...fav,
          createdAt: new Date(fav.createdAt)
        }));
      } catch (e) {
        console.error('Error parsing favorites:', e);
        return [];
      }
    }
    return [];
  },

  // Check if a recipe is favorited
  isFavorite(recipeTitle: string, ingredients: string[]): boolean {
    const favorites = this.getFavorites();
    return favorites.some(
      fav => fav.recipe.title === recipeTitle &&
             JSON.stringify(fav.ingredients) === JSON.stringify(ingredients)
    );
  },

  // Add a recipe to favorites
  addFavorite(
    recipe: Recipe,
    ingredients: string[],
    storyboard?: Storyboard,
    videoUrls?: string[],
    voiceoverUrl?: string
  ): FavoriteRecipe {
    const favorites = this.getFavorites();
    
    // Check if already favorited
    const existingIndex = favorites.findIndex(
      fav => fav.recipe.title === recipe.title &&
             JSON.stringify(fav.ingredients) === JSON.stringify(ingredients)
    );

    const favorite: FavoriteRecipe = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipe,
      storyboard,
      videoUrls,
      voiceoverUrl,
      ingredients,
      createdAt: new Date()
    };

    if (existingIndex >= 0) {
      // Update existing favorite
      favorites[existingIndex] = favorite;
    } else {
      // Add new favorite
      favorites.push(favorite);
    }

    this.saveFavorites(favorites);
    console.log('Recipe favorited:', recipe.title);
    return favorite;
  },

  // Remove a recipe from favorites
  removeFavorite(recipeTitle: string, ingredients: string[]): boolean {
    const favorites = this.getFavorites();
    const initialLength = favorites.length;
    
    const filtered = favorites.filter(
      fav => !(fav.recipe.title === recipeTitle &&
               JSON.stringify(fav.ingredients) === JSON.stringify(ingredients))
    );

    if (filtered.length < initialLength) {
      this.saveFavorites(filtered);
      console.log('Recipe unfavorited:', recipeTitle);
      return true;
    }
    return false;
  },

  // Remove favorite by ID
  removeFavoriteById(favoriteId: string): boolean {
    const favorites = this.getFavorites();
    const initialLength = favorites.length;
    
    const filtered = favorites.filter(fav => fav.id !== favoriteId);
    
    if (filtered.length < initialLength) {
      this.saveFavorites(filtered);
      console.log('Favorite removed by ID:', favoriteId);
      return true;
    }
    return false;
  },

  // Save favorites to localStorage
  saveFavorites(favorites: FavoriteRecipe[]): void {
    const key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(favorites));
  },

  // Clear all favorites for current user
  clearAllFavorites(): void {
    const key = this.getStorageKey();
    localStorage.removeItem(key);
    console.log('All favorites cleared');
  },

  // Get favorite count
  getFavoriteCount(): number {
    return this.getFavorites().length;
  }
};

