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
      <div className="h-screen w-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-4 pb-24">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-pink-500 p-4">
          <h1 className="text-white text-2xl font-bold">foogle</h1>
        </div>
        
        <div className="text-center max-w-md mt-20">
          <h2 className="text-3xl font-bold text-white mb-2">Your favorites</h2>
          <p className="text-white text-sm mb-8">all your past favs in one place!</p>
          
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <HeartFilledIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Favorites Yet</h3>
            <p className="text-gray-600 mb-6">
              Start exploring recipes and heart your favorites to see them here!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-pink-50 to-white relative pb-16">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-pink-500 p-4 z-10">
        <h1 className="text-white text-2xl font-bold mb-2">foogle</h1>
        <h2 className="text-white text-xl font-semibold">Your favorites</h2>
        <p className="text-white text-sm">all your past favs in one place!</p>
      </div>
      
      {/* Favorites list */}
      <div className="mt-32 px-4 pb-4 overflow-y-auto h-full">
        <div className="space-y-3">
          {favorites.map((favorite, index) => (
            <div
              key={favorite.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex items-center cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                // Convert to full-screen view when clicked
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
                onOpenAgent?.(culinaryPlan);
              }}
            >
              {/* Recipe name on left */}
              <div className="flex-1 p-4 bg-pink-100">
                <h3 className="text-lg font-semibold text-pink-800">{favorite.recipe.title}</h3>
              </div>
              
              {/* Recipe image on right */}
              <div className="w-24 h-24 flex-shrink-0">
                {favorite.videoUrls && favorite.videoUrls.length > 0 ? (
                  <video
                    src={favorite.videoUrls[0]}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{favorite.recipe.title.charAt(0)}</span>
                  </div>
                )}
              </div>
              
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFavorite(favorite.id);
                }}
                className="p-2 text-red-500 hover:text-red-700 transition-colors"
                title="Remove from favorites"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

