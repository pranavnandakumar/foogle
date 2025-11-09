import React, { useState, useEffect, useRef, useCallback } from 'react';
import { favoritesService, type FavoriteRecipe } from '../services/favoritesService';
import { FullScreenRecipeCard } from './FullScreenRecipeCard';
import { HeartFilledIcon, XIcon, HomeIcon } from './Icons';
import type { CulinaryPlan } from '../types';

interface FavoritesViewProps {
  onBack: () => void;
  onOpenAgent?: (culinaryPlan: CulinaryPlan) => void;
  onFavoriteChange?: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onBack, onOpenAgent, onFavoriteChange }) => {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [visibleFavoriteIndex, setVisibleFavoriteIndex] = useState<number>(0);
  const favoriteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const favs = favoritesService.getFavorites();
    setFavorites(favs);
    console.log('Loaded favorites:', favs.length);
  };

  // Set up Intersection Observer for favorites scrolling
  useEffect(() => {
    if (favorites.length === 0) return;

    const observerOptions = {
      root: scrollerRef.current,
      rootMargin: '-45% 0px -45% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    };

    const observer = new IntersectionObserver((entries) => {
      let maxRatio = 0;
      let mostVisibleIndex = -1;

      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-favorite-index') || '-1');
        if (index >= 0 && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisibleIndex = index;
        }
      });

      if (mostVisibleIndex >= 0 && mostVisibleIndex !== visibleFavoriteIndex) {
        setVisibleFavoriteIndex(mostVisibleIndex);
      }
    }, observerOptions);

    favoriteRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    // Set initial visible favorite
    if (favoriteRefs.current[0]) {
      setVisibleFavoriteIndex(0);
    }

    return () => {
      observer.disconnect();
    };
  }, [favorites.length, visibleFavoriteIndex]);

  // Scroll event handler for favorites
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || favorites.length === 0) return;

    const handleScroll = () => {
      const viewportHeight = scroller.clientHeight;
      const scrollTop = scroller.scrollTop;
      const viewportCenter = scrollTop + viewportHeight / 2;

      let closestIndex = -1;
      let closestDistance = Infinity;

      favoriteRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const scrollerRect = scroller.getBoundingClientRect();
          const cardTop = rect.top - scrollerRect.top + scrollTop;
          const cardCenter = cardTop + rect.height / 2;
          const distanceFromCenter = Math.abs(cardCenter - viewportCenter);

          if (distanceFromCenter < closestDistance) {
            closestDistance = distanceFromCenter;
            closestIndex = index;
          }
        }
      });

      if (closestIndex >= 0 && closestIndex !== visibleFavoriteIndex) {
        setVisibleFavoriteIndex(closestIndex);
      }
    };

    let rafId: number;
    const optimizedScrollHandler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    scroller.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    handleScroll();

    return () => {
      scroller.removeEventListener('scroll', optimizedScrollHandler);
      cancelAnimationFrame(rafId);
    };
  }, [favorites.length, visibleFavoriteIndex]);

  const handleRemoveFavorite = useCallback((favoriteId: string) => {
    const currentLength = favorites.length;
    favoritesService.removeFavoriteById(favoriteId);
    const updatedFavorites = favoritesService.getFavorites();
    setFavorites(updatedFavorites);
    onFavoriteChange?.();
    
    // Adjust visible index if needed
    if (updatedFavorites.length === 0) {
      // No favorites left - will show empty state
      return;
    }
    
    if (visibleFavoriteIndex >= currentLength - 1) {
      // Was viewing the last favorite - move to new last
      setVisibleFavoriteIndex(Math.max(0, updatedFavorites.length - 1));
    } else if (visibleFavoriteIndex < updatedFavorites.length) {
      // Stay on same index (favorite was removed before current)
      // No change needed
    }
  }, [favorites, visibleFavoriteIndex, onFavoriteChange]);

  if (favorites.length === 0) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-4">
        {/* Navigation header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
          >
            <HomeIcon className="w-5 h-5 text-gray-600" />
            <span>Home</span>
          </button>
        </div>
        
        <div className="text-center max-w-md">
          <HeartFilledIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Favorites Yet</h2>
          <p className="text-gray-600 mb-6">
            Start exploring recipes and heart your favorites to see them here!
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
          >
            Explore Recipes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black relative">
      {/* Navigation header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors pointer-events-auto"
        >
          <HomeIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Home</span>
        </button>
        <div className="bg-black/50 text-white px-3 py-2 rounded-full text-sm pointer-events-auto">
          {visibleFavoriteIndex + 1} of {favorites.length}
        </div>
      </div>

      {/* Favorites scroller */}
      <div ref={scrollerRef} className="h-screen w-screen overflow-y-auto snap-y snap-mandatory">
        {favorites.map((favorite, index) => {
          // Convert favorite to CulinaryPlan format for FullScreenRecipeCard
          const culinaryPlan: CulinaryPlan = {
            ingredients: favorite.ingredients,
            recipes: [favorite.recipe],
            storyboard: favorite.storyboard || {
              hook: '',
              voiceover_script: '',
              video_description: '',
              caption: favorite.recipe.title
            },
            videoUrls: favorite.videoUrls || [],
            recipeVideos: { 0: favorite.videoUrls || [] },
            recipeStoryboards: favorite.storyboard ? { 0: favorite.storyboard } : undefined,
            recipeVoiceovers: favorite.voiceoverUrl ? { 0: favorite.voiceoverUrl } : undefined
          };

          const isVisible = visibleFavoriteIndex === index;

          return (
            <div
              key={favorite.id}
              ref={(el) => { favoriteRefs.current[index] = el; }}
              data-favorite-index={index}
              className="h-screen w-screen snap-start flex items-center justify-center bg-black relative"
            >
              <FullScreenRecipeCard
                recipe={favorite.recipe}
                storyboard={favorite.storyboard}
                videoUrls={favorite.videoUrls || []}
                onReset={onBack}
                onOpenAgent={() => onOpenAgent?.(culinaryPlan)}
                culinaryPlan={culinaryPlan}
                isVisible={isVisible}
                recipeIndex={0}
                onFavoriteChange={() => {
                  // When heart is clicked, reload favorites to update the view
                  loadFavorites();
                  onFavoriteChange?.();
                }}
              />

              {/* Remove favorite button overlay */}
              <div className="absolute top-20 right-4 z-20">
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="bg-red-500/90 hover:bg-red-600 text-white p-3 rounded-full transition-colors shadow-lg flex items-center gap-2"
                  title="Remove from favorites"
                >
                  <XIcon className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">Remove</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

