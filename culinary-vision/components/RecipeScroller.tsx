import React from 'react';
import type { CulinaryPlan } from '../types';
import { FullScreenRecipeCard } from './FullScreenRecipeCard';

interface RecipeScrollerProps {
  plan: CulinaryPlan;
  onReset: () => void;
  onOpenAgent?: () => void;
}

// Placeholder videos to use for the UI layout while generation is disabled.
const PLACEHOLDER_VIDEOS = [
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];


export const RecipeScroller: React.FC<RecipeScrollerProps> = ({ plan, onReset, onOpenAgent }) => {
  return (
    <div className="h-screen w-screen overflow-y-auto snap-y snap-mandatory">
      {plan.recipes.map((recipe, index) => {
        let videoUrls: string[];
        
        // Check if we have generated videos for this recipe
        // Ensure we're working with arrays
        const recipeVideoArray = plan.recipeVideos?.[index];
        if (recipeVideoArray && Array.isArray(recipeVideoArray) && recipeVideoArray.length > 0) {
          // Use generated video for this recipe - ensure all items are strings
          videoUrls = recipeVideoArray.filter((url): url is string => typeof url === 'string');
          console.log(`Recipe ${index} video URLs:`, videoUrls);
        } else if (index === 0 && plan.videoUrls && Array.isArray(plan.videoUrls) && plan.videoUrls.length > 0) {
          // Fallback to legacy videoUrls for first recipe - ensure all items are strings
          videoUrls = plan.videoUrls.filter((url): url is string => typeof url === 'string');
          console.log(`First recipe video URLs (legacy):`, videoUrls);
        } else {
          // No videos available - will show beautiful gradient background
          console.log(`No video URLs available for recipe ${index}, showing gradient background`);
          videoUrls = [];
        }

        // Use storyboard from recipeStoryboards if available, otherwise fall back to plan.storyboard for first recipe
        const storyboard = plan.recipeStoryboards?.[index] || (index === 0 ? plan.storyboard : undefined);

        return (
          <div key={recipe.title} className="h-screen w-screen snap-start flex items-center justify-center bg-black">
            <FullScreenRecipeCard
              recipe={recipe}
              storyboard={storyboard}
              videoUrls={videoUrls}
              onReset={onReset}
              onOpenAgent={onOpenAgent}
              culinaryPlan={plan}
            />
          </div>
        );
      })}
    </div>
  );
};
