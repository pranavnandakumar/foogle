import React, { useState, useEffect, useRef, useCallback } from 'react';
import { feedService, type FeedItem } from '../services/feedService';
import { FullScreenRecipeCard } from './FullScreenRecipeCard';
import { HeartIcon, HeartFilledIcon } from './Icons';
import { authService } from '../services/authService';
import type { CulinaryPlan } from '../types';

interface FeedViewProps {
  onClose?: () => void;
  onRecipeLike?: (feedItem: FeedItem) => void;
  onOpenAgent?: (culinaryPlan: CulinaryPlan) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ onClose, onRecipeLike, onOpenAgent }) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [visibleItemIndex, setVisibleItemIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(() => {
    setIsLoading(true);
    try {
      // Force refresh feed to clear cache and ensure correct video mappings
      feedService.forceRefreshFeed();
      const feed = feedService.getFeed(10);
      setFeedItems(feed);
      console.log('Loaded feed with', feed.length, 'items');
      console.log('Video-to-Recipe Mappings:');
      feed.forEach((item, index) => {
        console.log(`  ${index + 1}. Recipe: "${item.recipe.title}" -> Video: ${item.videoUrl || 'NO VIDEO'}`);
      });
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load feed on mount
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Listen for feed refresh events (when new recipes are generated)
  useEffect(() => {
    const handleFeedRefresh = () => {
      console.log('Feed refresh event received, reloading feed...');
      loadFeed();
    };
    
    window.addEventListener('feedRefresh', handleFeedRefresh);
    return () => {
      window.removeEventListener('feedRefresh', handleFeedRefresh);
    };
  }, [loadFeed]);

  // Set up Intersection Observer for feed scrolling - MORE AGGRESSIVE
  useEffect(() => {
    if (feedItems.length === 0) return;

    const observerOptions = {
      root: scrollerRef.current,
      rootMargin: '-40% 0px -40% 0px', // More aggressive - larger visible area
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0] // More granular thresholds
    };

    const observer = new IntersectionObserver((entries) => {
      let maxRatio = 0;
      let mostVisibleIndex = -1;

      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-feed-index') || '-1');
        if (index >= 0) {
          // Use intersection ratio to find most visible
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisibleIndex = index;
          }
        }
      });

      if (mostVisibleIndex >= 0 && mostVisibleIndex !== visibleItemIndex) {
        console.log(`Feed: Switching to item ${mostVisibleIndex} (${feedItems[mostVisibleIndex]?.recipe.title})`);
        setVisibleItemIndex(mostVisibleIndex);
      }
    }, observerOptions);

    // Observe all item refs
    itemRefs.current.forEach((ref, index) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    // Set initial visible item
    if (itemRefs.current[0]) {
      setVisibleItemIndex(0);
    }

    return () => {
      observer.disconnect();
    };
  }, [feedItems.length, visibleItemIndex, feedItems]);

  // Scroll event handler - IMMEDIATE response for video playback
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || feedItems.length === 0) return;

    const handleScroll = () => {
      const viewportHeight = scroller.clientHeight;
      const scrollTop = scroller.scrollTop;
      const viewportCenter = scrollTop + viewportHeight / 2;

      let closestIndex = -1;
      let closestDistance = Infinity;

      itemRefs.current.forEach((ref, index) => {
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

      if (closestIndex >= 0 && closestIndex !== visibleItemIndex) {
        console.log(`Feed scroll: Switching to item ${closestIndex} (${feedItems[closestIndex]?.recipe.title})`);
        setVisibleItemIndex(closestIndex);
      }
    };

    // Use requestAnimationFrame for smooth, immediate updates
    let rafId: number;
    const optimizedScrollHandler = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    scroller.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    // Also check immediately on mount
    handleScroll();

    return () => {
      scroller.removeEventListener('scroll', optimizedScrollHandler);
      cancelAnimationFrame(rafId);
    };
  }, [feedItems.length, visibleItemIndex, feedItems]);

  const handleLike = useCallback((feedItem: FeedItem) => {
    if (!authService.isAuthenticated()) {
      // Trigger login modal
      window.dispatchEvent(new CustomEvent('openLoginModal'));
      return;
    }
    
    // Toggle like in feed service (this updates both likedIds and feed cache)
    feedService.toggleLike(feedItem.id);
    
    // Reload feed to get updated state
    const updatedFeed = feedService.getFeed();
    setFeedItems(updatedFeed);
    
    // Find the updated item
    const updatedItem = updatedFeed.find(item => item.id === feedItem.id);
    if (updatedItem) {
      onRecipeLike?.(updatedItem);
    }
  }, [onRecipeLike]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading feed...</p>
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl">No recipes available</p>
          <button
            onClick={loadFeed}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-teal-500 p-4 z-20">
        <h1 className="text-white text-2xl font-bold">foogle</h1>
      </div>

      {/* Feed scroller - render all items for proper video preloading */}
      <div ref={scrollerRef} className="h-screen w-screen overflow-y-auto snap-y snap-mandatory pt-16">
        {feedItems.map((feedItem, index) => {
          // Convert feed item to CulinaryPlan format
          const culinaryPlan: CulinaryPlan = {
            ingredients: [], // Feed items don't have ingredient lists
            recipes: [feedItem.recipe],
            storyboard: feedItem.storyboard || {
              hook: '',
              voiceover_script: '',
              video_description: '',
              caption: feedItem.recipe.title
            },
            videoUrls: feedItem.videoUrl ? [feedItem.videoUrl] : [],
            recipeVideos: feedItem.videoUrl ? { 0: [feedItem.videoUrl] } : {},
            recipeStoryboards: feedItem.storyboard ? { 0: feedItem.storyboard } : undefined,
            recipeVoiceovers: feedItem.voiceoverUrl ? { 0: feedItem.voiceoverUrl } : undefined
          };

          const isVisible = visibleItemIndex === index;
          // Preload videos for adjacent items (previous and next) for smoother scrolling
          const shouldPreload = Math.abs(index - visibleItemIndex) <= 1;

          return (
            <div
              key={`feed-${feedItem.id}-${index}`}
              ref={(el) => { itemRefs.current[index] = el; }}
              data-feed-index={index}
              className="h-screen w-screen snap-start flex items-center justify-center bg-black relative pb-20"
            >
              <FullScreenRecipeCard
                key={`card-${feedItem.id}-${index}`}
                recipe={feedItem.recipe}
                storyboard={feedItem.storyboard}
                videoUrls={feedItem.videoUrl ? [feedItem.videoUrl] : []}
                onReset={() => {}}
                onOpenAgent={() => onOpenAgent?.(culinaryPlan)}
                culinaryPlan={culinaryPlan}
                isVisible={isVisible}
                recipeIndex={index}
                isLiked={feedItem.isLiked}
                onLike={() => handleLike(feedItem)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

