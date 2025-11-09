export interface Recipe {
  title: string;
  time_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  steps: string[];
  missing_items: string[];
}

export interface Storyboard {
  hook: string;
  voiceover_script: string;
  video_description: string;
  caption: string;
}

export interface CulinaryPlan {
  ingredients: string[];
  recipes: Recipe[];
  storyboard: Storyboard; // Legacy: storyboard for first recipe
  videoUrls?: string[]; // Legacy: videos for first recipe
  recipeVideos?: { [recipeIndex: number]: string[] }; // New: videos per recipe
  recipeStoryboards?: { [recipeIndex: number]: Storyboard }; // New: storyboards per recipe
  recipeVoiceovers?: { [recipeIndex: number]: string }; // New: voiceover audio URLs per recipe
}

// Agent-related types
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ShoppingList {
  items: ShoppingListItem[];
  totalEstimatedCost?: string;
  stores?: string[];
}

export interface ShoppingListItem {
  name: string;
  quantity: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'spices' | 'other';
  optional?: boolean;
}

export interface MealPlan {
  recipes: Recipe[];
  schedule: MealScheduleItem[];
  prepNotes: string[];
  estimatedTotalTime: number;
}

export interface MealScheduleItem {
  day: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: Recipe;
  prepTime?: number;
}

export interface Substitution {
  original: string;
  alternatives: string[];
  reason: string;
}

export interface AgentToolResult {
  toolName: string;
  result: any;
  success: boolean;
  error?: string;
}
