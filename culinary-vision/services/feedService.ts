// Feed service for managing TikTok-style recipe feed with default recipes, tags, and recommendations

import type { Recipe, Storyboard } from '../types';

export interface FeedItem {
  id: string;
  recipe: Recipe;
  storyboard?: Storyboard;
  videoUrl?: string;
  voiceoverUrl?: string;
  tags: string[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  isDefault: boolean;
  isLiked: boolean;
  createdAt: Date;
  likes: number;
}

export interface FeedCache {
  items: FeedItem[];
  lastUpdated: Date;
  userId?: string;
}

const FEED_CACHE_KEY = 'culinary_vision_feed_cache';
const LIKED_RECIPES_KEY = 'culinary_vision_liked_feed_recipes';
const USER_RECIPES_KEY = 'culinary_vision_user_feed_recipes';

// Default recipe videos (using existing placeholder videos)
const DEFAULT_VIDEOS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

// 10 Default recipes covering wide range of ingredients and meal types
const DEFAULT_RECIPES: Omit<FeedItem, 'id' | 'createdAt' | 'isLiked' | 'likes'>[] = [
  {
    recipe: {
      title: "Classic Avocado Toast",
      time_minutes: 5,
      difficulty: "easy",
      steps: [
        "Toast whole grain bread until golden",
        "Mash ripe avocado with lemon juice",
        "Season with salt and pepper",
        "Spread on toast and top with cherry tomatoes",
        "Add a drizzle of olive oil"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Start your day right with this simple breakfast!",
      voiceover_script: "Perfect avocado toast in just five minutes. Creamy, fresh, and delicious.",
      video_description: "Close-up of toasting bread, mashing avocado, spreading on toast, and adding toppings",
      caption: "5-Min Avocado Toast"
    },
    videoUrl: DEFAULT_VIDEOS[0],
    tags: ["breakfast", "vegetarian", "healthy", "quick", "avocado", "bread"],
    mealType: "breakfast",
    isDefault: true
  },
  {
    recipe: {
      title: "Mediterranean Quinoa Bowl",
      time_minutes: 20,
      difficulty: "easy",
      steps: [
        "Cook quinoa according to package",
        "Dice cucumbers and tomatoes",
        "Add feta cheese and olives",
        "Drizzle with olive oil and lemon",
        "Toss with fresh herbs"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Fresh and healthy Mediterranean flavors!",
      voiceover_script: "Colorful quinoa bowl with fresh vegetables and tangy feta. Light and satisfying.",
      video_description: "Cooking quinoa, chopping vegetables, assembling bowl with vibrant ingredients",
      caption: "Mediterranean Quinoa"
    },
    videoUrl: DEFAULT_VIDEOS[1],
    tags: ["lunch", "vegetarian", "healthy", "mediterranean", "quinoa", "vegetables"],
    mealType: "lunch",
    isDefault: true
  },
  {
    recipe: {
      title: "Spicy Thai Basil Stir Fry",
      time_minutes: 15,
      difficulty: "easy",
      steps: [
        "Heat oil in a wok",
        "Add garlic and chili",
        "Stir fry vegetables quickly",
        "Add soy sauce and basil",
        "Serve over rice"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Bursting with Thai flavors in minutes!",
      voiceover_script: "Fiery stir fry with fresh basil and crisp vegetables. Fast and flavorful.",
      video_description: "Sizzling wok with vegetables, adding sauce, tossing with basil leaves",
      caption: "Thai Basil Stir Fry"
    },
    videoUrl: DEFAULT_VIDEOS[2],
    tags: ["dinner", "asian", "spicy", "vegetables", "quick", "thai"],
    mealType: "dinner",
    isDefault: true
  },
  {
    recipe: {
      title: "Berry Smoothie Bowl",
      time_minutes: 10,
      difficulty: "easy",
      steps: [
        "Blend frozen berries with banana",
        "Add yogurt until smooth",
        "Pour into bowl",
        "Top with granola and fresh berries",
        "Drizzle with honey"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Cool and refreshing breakfast bowl!",
      voiceover_script: "Creamy smoothie bowl packed with berries and topped with crunchy granola.",
      video_description: "Blending fruits, pouring into bowl, adding colorful toppings",
      caption: "Berry Smoothie Bowl"
    },
    videoUrl: DEFAULT_VIDEOS[3],
    tags: ["breakfast", "healthy", "fruits", "smoothie", "quick", "berries"],
    mealType: "breakfast",
    isDefault: true
  },
  {
    recipe: {
      title: "Herb-Crusted Salmon",
      time_minutes: 25,
      difficulty: "easy",
      steps: [
        "Preheat oven to 400°F",
        "Mix herbs with breadcrumbs",
        "Press onto salmon fillets",
        "Bake until flaky",
        "Serve with lemon wedges"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Elegant salmon dinner made simple!",
      voiceover_script: "Crispy herb crust on tender salmon. Restaurant quality at home.",
      video_description: "Coating salmon with herbs, baking in oven, golden crust forming",
      caption: "Herb-Crusted Salmon"
    },
    videoUrl: DEFAULT_VIDEOS[4],
    tags: ["dinner", "seafood", "healthy", "herbs", "salmon", "elegant"],
    mealType: "dinner",
    isDefault: true
  },
  {
    recipe: {
      title: "Caprese Salad Skewers",
      time_minutes: 10,
      difficulty: "easy",
      steps: [
        "Thread cherry tomatoes on skewers",
        "Add fresh mozzarella balls",
        "Tuck in basil leaves",
        "Drizzle with balsamic",
        "Season with salt and pepper"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Perfect party appetizer in minutes!",
      voiceover_script: "Fresh caprese skewers with mozzarella, tomatoes, and basil. Simple elegance.",
      video_description: "Threading ingredients onto skewers, arranging on platter, drizzling balsamic",
      caption: "Caprese Skewers"
    },
    videoUrl: DEFAULT_VIDEOS[5],
    tags: ["snack", "vegetarian", "italian", "appetizer", "tomatoes", "mozzarella"],
    mealType: "snack",
    isDefault: true
  },
  {
    recipe: {
      title: "Mexican Street Corn",
      time_minutes: 15,
      difficulty: "easy",
      steps: [
        "Grill corn until charred",
        "Mix mayo with lime juice",
        "Brush onto corn",
        "Sprinkle with chili powder",
        "Top with cilantro and cheese"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Authentic Mexican street food at home!",
      voiceover_script: "Smoky grilled corn with creamy sauce and spices. Irresistibly delicious.",
      video_description: "Grilling corn, applying sauce, sprinkling spices, colorful toppings",
      caption: "Mexican Street Corn"
    },
    videoUrl: DEFAULT_VIDEOS[6],
    tags: ["snack", "mexican", "spicy", "grilled", "corn", "street-food"],
    mealType: "snack",
    isDefault: true
  },
  {
    recipe: {
      title: "Lemon Herb Chicken",
      time_minutes: 30,
      difficulty: "easy",
      steps: [
        "Marinate chicken in lemon and herbs",
        "Heat pan over medium high",
        "Cook chicken until golden",
        "Add lemon slices to pan",
        "Serve with roasted vegetables"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Bright and zesty chicken dinner!",
      voiceover_script: "Tender chicken with fresh lemon and aromatic herbs. Light and flavorful.",
      video_description: "Marinating chicken, searing in pan, adding lemon, golden brown finish",
      caption: "Lemon Herb Chicken"
    },
    videoUrl: DEFAULT_VIDEOS[7],
    tags: ["dinner", "chicken", "herbs", "lemon", "healthy", "protein"],
    mealType: "dinner",
    isDefault: true
  },
  {
    recipe: {
      title: "Overnight Oats",
      time_minutes: 5,
      difficulty: "easy",
      steps: [
        "Mix oats with milk",
        "Add chia seeds and honey",
        "Stir in your favorite fruits",
        "Refrigerate overnight",
        "Top with nuts in morning"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Make ahead breakfast for busy mornings!",
      voiceover_script: "Creamy overnight oats with fruits and nuts. Prep tonight, enjoy tomorrow.",
      video_description: "Mixing oats and milk, adding fruits, layering in jar, morning reveal",
      caption: "Overnight Oats"
    },
    videoUrl: DEFAULT_VIDEOS[0],
    tags: ["breakfast", "healthy", "meal-prep", "oats", "fruits", "make-ahead"],
    mealType: "breakfast",
    isDefault: true
  },
  {
    recipe: {
      title: "Vegetable Curry",
      time_minutes: 25,
      difficulty: "easy",
      steps: [
        "Sauté onions and spices",
        "Add vegetables and cook",
        "Pour in coconut milk",
        "Simmer until tender",
        "Serve over rice"
      ],
      missing_items: []
    },
    storyboard: {
      hook: "Warm and comforting vegetable curry!",
      voiceover_script: "Rich coconut curry with mixed vegetables. Spicy, creamy, and satisfying.",
      video_description: "Sautéing spices, adding vegetables, pouring coconut milk, simmering curry",
      caption: "Vegetable Curry"
    },
    videoUrl: DEFAULT_VIDEOS[1],
    tags: ["dinner", "vegetarian", "curry", "spices", "coconut", "vegetables"],
    mealType: "dinner",
    isDefault: true
  }
];

export const feedService = {
  // Get user ID from localStorage
  getUserId(): string {
    try {
      const storedUser = localStorage.getItem('culinary_vision_user');
      const sessionToken = localStorage.getItem('culinary_vision_session');
      if (storedUser && sessionToken) {
        const user = JSON.parse(storedUser);
        return user.id || 'guest';
      }
      return 'guest';
    } catch {
      return 'guest';
    }
  },

  // Get cached feed
  getCachedFeed(): FeedItem[] | null {
    try {
      const cached = localStorage.getItem(FEED_CACHE_KEY);
      if (cached) {
        const feedCache: FeedCache = JSON.parse(cached);
        // Restore date objects
        return feedCache.items.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
      }
    } catch (e) {
      console.error('Error loading cached feed:', e);
    }
    return null;
  },

  // Save feed to cache
  saveFeedToCache(items: FeedItem[]): void {
    try {
      const feedCache: FeedCache = {
        items,
        lastUpdated: new Date(),
        userId: this.getUserId()
      };
      localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(feedCache));
    } catch (e) {
      console.error('Error saving feed cache:', e);
    }
  },

  // Get liked recipe IDs
  getLikedRecipeIds(): Set<string> {
    try {
      const liked = localStorage.getItem(LIKED_RECIPES_KEY);
      if (liked) {
        return new Set(JSON.parse(liked));
      }
    } catch (e) {
      console.error('Error loading liked recipes:', e);
    }
    return new Set();
  },

  // Save liked recipe IDs
  saveLikedRecipeIds(likedIds: Set<string>): void {
    try {
      localStorage.setItem(LIKED_RECIPES_KEY, JSON.stringify(Array.from(likedIds)));
    } catch (e) {
      console.error('Error saving liked recipes:', e);
    }
  },

  // Toggle like on a feed item
  toggleLike(feedItemId: string): boolean {
    const likedIds = this.getLikedRecipeIds();
    const isLiked = likedIds.has(feedItemId);
    
    if (isLiked) {
      likedIds.delete(feedItemId);
    } else {
      likedIds.add(feedItemId);
    }
    
    this.saveLikedRecipeIds(likedIds);
    
    // Update the feed item's isLiked status in the cached feed
    const cached = this.getCachedFeed();
    if (cached) {
      const itemIndex = cached.findIndex(item => item.id === feedItemId);
      if (itemIndex !== -1) {
        cached[itemIndex].isLiked = !isLiked;
        this.saveFeedToCache(cached);
      }
    }
    
    return !isLiked;
  },

  // Get user-generated recipes
  getUserRecipes(): FeedItem[] {
    try {
      const userRecipes = localStorage.getItem(USER_RECIPES_KEY);
      if (userRecipes) {
        const recipes: FeedItem[] = JSON.parse(userRecipes);
        return recipes.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
      }
    } catch (e) {
      console.error('Error loading user recipes:', e);
    }
    return [];
  },

  // Add user-generated recipe to feed
  addUserRecipe(
    recipe: Recipe,
    storyboard?: Storyboard,
    videoUrl?: string,
    voiceoverUrl?: string,
    tags: string[] = []
  ): FeedItem {
    const userRecipes = this.getUserRecipes();
    const mealType = this.inferMealType(recipe, tags);
    
    const feedItem: FeedItem = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipe,
      storyboard,
      videoUrl,
      voiceoverUrl,
      tags: tags.length > 0 ? tags : this.inferTags(recipe),
      mealType,
      isDefault: false,
      isLiked: false,
      createdAt: new Date(),
      likes: 0
    };

    userRecipes.push(feedItem);
    localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(userRecipes));
    
    return feedItem;
  },

  // Infer meal type from recipe
  inferMealType(recipe: Recipe, tags: string[]): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const title = recipe.title.toLowerCase();
    const steps = recipe.steps.join(' ').toLowerCase();
    const allText = `${title} ${steps} ${tags.join(' ')}`.toLowerCase();

    if (allText.includes('breakfast') || allText.includes('toast') || allText.includes('oat') || allText.includes('smoothie') || allText.includes('egg')) {
      return 'breakfast';
    }
    if (allText.includes('lunch') || allText.includes('salad') || allText.includes('bowl') || allText.includes('sandwich')) {
      return 'lunch';
    }
    if (allText.includes('snack') || allText.includes('appetizer') || allText.includes('skewer')) {
      return 'snack';
    }
    return 'dinner';
  },

  // Infer tags from recipe
  inferTags(recipe: Recipe): string[] {
    const tags: string[] = [];
    const title = recipe.title.toLowerCase();
    const ingredients = recipe.steps.join(' ').toLowerCase();

    // Meal type tags
    if (title.includes('breakfast') || title.includes('toast') || title.includes('oat')) tags.push('breakfast');
    if (title.includes('lunch') || title.includes('salad') || title.includes('bowl')) tags.push('lunch');
    if (title.includes('dinner') || title.includes('curry') || title.includes('stir fry')) tags.push('dinner');

    // Ingredient tags
    if (ingredients.includes('vegetable') || ingredients.includes('veggie')) tags.push('vegetables');
    if (ingredients.includes('fruit') || ingredients.includes('berry')) tags.push('fruits');
    if (ingredients.includes('spice') || ingredients.includes('chili') || ingredients.includes('curry')) tags.push('spices');
    if (ingredients.includes('chicken')) tags.push('chicken');
    if (ingredients.includes('salmon') || ingredients.includes('fish')) tags.push('seafood');
    if (!ingredients.includes('meat') && !ingredients.includes('chicken') && !ingredients.includes('fish')) tags.push('vegetarian');

    // Cooking style tags
    if (recipe.time_minutes <= 15) tags.push('quick');
    if (recipe.difficulty === 'easy') tags.push('easy');
    if (ingredients.includes('healthy') || ingredients.includes('fresh')) tags.push('healthy');

    return tags.length > 0 ? tags : ['recipe'];
  },

  // Calculate similarity between two recipes (for recommendations)
  calculateSimilarity(recipe1: Recipe, recipe2: Recipe, tags1: string[], tags2: string[]): number {
    let similarity = 0;

    // Check common ingredients in steps
    const steps1 = recipe1.steps.join(' ').toLowerCase();
    const steps2 = recipe2.steps.join(' ').toLowerCase();
    const commonWords = steps1.split(' ').filter(word => 
      word.length > 3 && steps2.includes(word)
    );
    similarity += commonWords.length * 0.1;

    // Check common tags
    const commonTags = tags1.filter(tag => tags2.includes(tag));
    similarity += commonTags.length * 0.3;

    // Check difficulty match
    if (recipe1.difficulty === recipe2.difficulty) {
      similarity += 0.2;
    }

    // Check time similarity (within 10 minutes)
    if (Math.abs(recipe1.time_minutes - recipe2.time_minutes) <= 10) {
      similarity += 0.2;
    }

    return Math.min(similarity, 1.0);
  },

  // Get personalized feed (mixes default and user recipes)
  getFeed(maxItems: number = 10): FeedItem[] {
    // Try to get cached feed first
    const cached = this.getCachedFeed();
    if (cached && cached.length >= maxItems) {
      // Update liked status
      const likedIds = this.getLikedRecipeIds();
      return cached.map(item => ({
        ...item,
        isLiked: likedIds.has(item.id)
      }));
    }

    // Build feed from scratch
    const userRecipes = this.getUserRecipes();
    const likedIds = this.getLikedRecipeIds();
    const feed: FeedItem[] = [];

    // Initialize default recipes
    const defaultItems: FeedItem[] = DEFAULT_RECIPES.map((recipe, index) => ({
      ...recipe,
      id: `default_${index}`,
      createdAt: new Date(),
      isLiked: likedIds.has(`default_${index}`),
      likes: Math.floor(Math.random() * 100) + 10, // Random likes for defaults
      videoUrl: recipe.videoUrl || DEFAULT_VIDEOS[index % DEFAULT_VIDEOS.length]
    }));

    // If we have user recipes, replace dissimilar default ones
    if (userRecipes.length > 0) {
      // Sort user recipes by creation date (newest first)
      const sortedUserRecipes = [...userRecipes].sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      // For each user recipe, find the most dissimilar default recipe to replace
      const defaultItemsToKeep: FeedItem[] = [];
      const userRecipesToAdd: FeedItem[] = [];

      for (const userRecipe of sortedUserRecipes.slice(0, maxItems)) {
        // Find default recipe with lowest similarity to user's liked/generated recipes
        let minSimilarity = 1.0;
        let leastSimilarDefault: FeedItem | null = null;

        for (const defaultItem of defaultItems) {
          if (defaultItemsToKeep.includes(defaultItem)) continue;

          // Calculate similarity to all user recipes
          let maxSimilarity = 0;
          for (const ur of userRecipes) {
            const sim = this.calculateSimilarity(
              userRecipe.recipe,
              defaultItem.recipe,
              userRecipe.tags,
              defaultItem.tags
            );
            maxSimilarity = Math.max(maxSimilarity, sim);
          }

          if (maxSimilarity < minSimilarity) {
            minSimilarity = maxSimilarity;
            leastSimilarDefault = defaultItem;
          }
        }

        if (leastSimilarDefault && minSimilarity < 0.3) {
          // Replace dissimilar default with user recipe
          userRecipesToAdd.push({
            ...userRecipe,
            isLiked: likedIds.has(userRecipe.id)
          });
        } else {
          // Keep default if it's somewhat similar
          if (leastSimilarDefault) {
            defaultItemsToKeep.push(leastSimilarDefault);
          }
        }
      }

      // Add user recipes first (newest content)
      feed.push(...userRecipesToAdd);

      // Fill remaining slots with default recipes
      const remainingSlots = maxItems - feed.length;
      for (const defaultItem of defaultItems) {
        if (feed.length >= maxItems) break;
        if (!userRecipesToAdd.some(ur => ur.id === defaultItem.id)) {
          feed.push(defaultItem);
        }
      }
    } else {
      // No user recipes, use all defaults
      feed.push(...defaultItems.slice(0, maxItems));
    }

    // Shuffle feed for variety (but keep user recipes towards the top)
    const userRecipeItems = feed.filter(item => !item.isDefault);
    const defaultItemsInFeed = feed.filter(item => item.isDefault);
    
    // Mix: user recipes first, then shuffled defaults
    const shuffledFeed = [
      ...userRecipeItems,
      ...defaultItemsInFeed.sort(() => Math.random() - 0.5)
    ].slice(0, maxItems);

    // Cache the feed
    this.saveFeedToCache(shuffledFeed);

    return shuffledFeed;
  },

  // Refresh feed (regenerate with latest user recipes)
  refreshFeed(maxItems: number = 10): FeedItem[] {
    // Clear cache to force regeneration
    localStorage.removeItem(FEED_CACHE_KEY);
    return this.getFeed(maxItems);
  }
};

