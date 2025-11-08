import React from 'react';
import type { CulinaryPlan } from '../types';
import { FullScreenRecipeCard } from './FullScreenRecipeCard';

interface RecipeScrollerProps {
  plan: CulinaryPlan;
  onReset: () => void;
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


export const RecipeScroller: React.FC<RecipeScrollerProps> = ({ plan, onReset }) => {
  return (
    <div className="h-screen w-screen overflow-y-auto snap-y snap-mandatory">
      {plan.recipes.map((recipe, index) => {
        const isFirstRecipe = index === 0;
        
        // Main recipe gets a multi-clip sequence based on the storyboard.
        // Others get a single, looping placeholder video.
        const videoUrls = isFirstRecipe && plan.storyboard
            ? PLACEHOLDER_VIDEOS.slice(0, plan.storyboard.scenes.length)
            : [PLACEHOLDER_VIDEOS[index % PLACEHOLDER_VIDEOS.length]];

        return (
          <div key={recipe.title} className="h-screen w-screen snap-start flex items-center justify-center bg-black">
            <FullScreenRecipeCard
              recipe={recipe}
              storyboard={isFirstRecipe ? plan.storyboard : undefined}
              videoUrls={videoUrls}
              onReset={onReset}
            />
          </div>
        );
      })}
    </div>
  );
};
