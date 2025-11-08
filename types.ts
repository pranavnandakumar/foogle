export interface Recipe {
  title: string;
  time_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  steps: string[];
  missing_items: string[];
}

export interface StoryboardScene {
  step: number;
  caption: string;
  duration_s: number;
}

export interface Storyboard {
  hook: string;
  voiceover_script: string;
  scenes: StoryboardScene[];
}

export interface CulinaryPlan {
  ingredients: string[];
  recipes: Recipe[];
  storyboard: Storyboard;
}
