import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { CulinaryPlan } from '../types';
import { FullScreenRecipeCard } from './FullScreenRecipeCard';

interface RecipeScrollerProps {
  plan: CulinaryPlan;
  onReset: () => void;
  onOpenAgent?: () => void;
  onFavoriteChange?: () => void;
}

// Placeholder videos to use for the UI layout while generation is disabled.
const PLACEHOLDER_VIDEOS = [
  '"/vids/berrymilksmoothie.mp4"',
  '/vids/avacadotoast.mp4',
  '/vids/overnightoats.mp4',
  '/vids/lemonchicken.mp4',
  '/vids/thaibasilcurry.mp4',
  '/vids/mexicancorn.mp4',
  '/vids/vegetablecurry.mp4',
  '/vids/herbcrustedsalmon.mp4',
];


export const RecipeScroller: React.FC<RecipeScrollerProps> = ({ plan, onReset, onOpenAgent, onFavoriteChange }) => {
  const [visibleRecipeIndex, setVisibleRecipeIndex] = useState<number>(0);
  const recipeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Callback to notify when a recipe becomes visible
  const handleRecipeVisible = useCallback((index: number) => {
    setVisibleRecipeIndex(index);
    console.log(`Recipe ${index} (${plan.recipes[index]?.title}) is now visible`);
  }, [plan.recipes]);

  // Set up Intersection Observer to detect visible recipe cards
  useEffect(() => {
    // More aggressive observer settings for immediate detection
    const observerOptions = {
      root: scrollerRef.current,
      rootMargin: '-45% 0px -45% 0px', // Recipe is considered visible when in center 10% of viewport
      threshold: [0, 0.25, 0.5, 0.75, 1.0] // Multiple thresholds for better detection
    };

    const observer = new IntersectionObserver((entries) => {
      // Find the entry with the highest intersection ratio (most visible)
      let maxRatio = 0;
      let mostVisibleIndex = -1;

      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-recipe-index') || '-1');
        if (index >= 0) {
          // Calculate how much of the recipe is visible in the viewport
          const intersectionRatio = entry.intersectionRatio;
          if (intersectionRatio > maxRatio) {
            maxRatio = intersectionRatio;
            mostVisibleIndex = index;
          }
        }
      });

      // Update visible recipe immediately when a new one is detected
      if (mostVisibleIndex >= 0 && mostVisibleIndex !== visibleRecipeIndex) {
        console.log(`Switching from recipe ${visibleRecipeIndex} to ${mostVisibleIndex}`);
        handleRecipeVisible(mostVisibleIndex);
      }
    }, observerOptions);

    // Observe all recipe cards
    const refsToObserve = recipeRefs.current.filter(ref => ref !== null);
    refsToObserve.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    // Set initial visible recipe immediately
    if (recipeRefs.current[0]) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        handleRecipeVisible(0);
      }, 100);
    }

    return () => {
      observer.disconnect();
    };
  }, [plan.recipes.length, handleRecipeVisible, visibleRecipeIndex]);
  
  // Also listen to scroll events for IMMEDIATE response (no debounce for faster switching)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    
    const handleScroll = () => {
      // Find which recipe is currently centered in viewport - IMMEDIATE check
      const viewportHeight = scroller.clientHeight;
      const scrollTop = scroller.scrollTop;
      const viewportCenter = scrollTop + viewportHeight / 2;
      
      let closestIndex = -1;
      let closestDistance = Infinity;
      
      // Check each recipe card's position
      recipeRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const scrollerRect = scroller.getBoundingClientRect();
          const cardTop = rect.top - scrollerRect.top + scrollTop;
          const cardCenter = cardTop + rect.height / 2;
          const distanceFromCenter = Math.abs(cardCenter - viewportCenter);
          
          // Find the card closest to the center
          if (distanceFromCenter < closestDistance) {
            closestDistance = distanceFromCenter;
            closestIndex = index;
          }
        }
      });
      
      // If we found a different recipe, switch immediately
      if (closestIndex >= 0 && closestIndex !== visibleRecipeIndex) {
        console.log(`🎬 Scroll: Switching to recipe ${closestIndex} (distance: ${closestDistance.toFixed(0)}px)`);
        handleRecipeVisible(closestIndex);
      }
    };

    // Use requestAnimationFrame for smooth, immediate updates
    let rafId: number;
    const optimizedScrollHandler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    scroller.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    
    // Also check on initial load
    handleScroll();
    
    return () => {
      scroller.removeEventListener('scroll', optimizedScrollHandler);
      cancelAnimationFrame(rafId);
    };
  }, [handleRecipeVisible, visibleRecipeIndex]);

  return (
    <div ref={scrollerRef} className="h-screen w-screen overflow-y-auto snap-y snap-mandatory">
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
        const isVisible = visibleRecipeIndex === index;

        return (
          <div 
            key={recipe.title} 
            ref={(el) => { recipeRefs.current[index] = el; }}
            data-recipe-index={index}
            className="h-screen w-screen snap-start flex items-center justify-center bg-black pb-20"
          >
            <FullScreenRecipeCard
              recipe={recipe}
              storyboard={storyboard}
              videoUrls={videoUrls}
              onReset={onReset}
              onOpenAgent={onOpenAgent}
              culinaryPlan={plan}
              isVisible={isVisible}
              recipeIndex={index}
              onFavoriteChange={onFavoriteChange}
            />
          </div>
        );
      })}
    </div>
  );
};
