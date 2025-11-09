import React, { useState, useEffect, useRef } from 'react';
import type { Recipe, Storyboard, CulinaryPlan } from '../types';
import { ChefHatIcon, ClockIcon, BarChartIcon, ListIcon, XIcon, SparklesIcon, VolumeIcon, VolumeOffIcon, PlayIcon, PauseIcon, HeartIcon, HeartFilledIcon } from './Icons';
import { favoritesService } from '../services/favoritesService';
import { authService } from '../services/authService';

interface FullScreenRecipeCardProps {
  recipe: Recipe;
  storyboard?: Storyboard;
  videoUrls: string[];
  onReset: () => void;
  onOpenAgent?: () => void;
  culinaryPlan?: CulinaryPlan;
  isVisible?: boolean;
  recipeIndex?: number;
  onFavoriteChange?: () => void;
  isLiked?: boolean; // For feed items - pass liked state from parent
  onLike?: () => void; // For feed items - handle like from parent
}

export const FullScreenRecipeCard: React.FC<FullScreenRecipeCardProps> = ({ 
  recipe, 
  storyboard, 
  videoUrls, 
  onReset, 
  onOpenAgent, 
  culinaryPlan,
  isVisible = false,
  recipeIndex = 0,
  onFavoriteChange,
  isLiked: externalIsLiked,
  onLike
}) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isVoiceoverPlaying, setIsVoiceoverPlaying] = useState(false);
  const [isVoiceoverMuted, setIsVoiceoverMuted] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Check if recipe is favorited
  useEffect(() => {
    if (externalIsLiked !== undefined) {
      // Use external liked state (from feed)
      setIsFavorited(externalIsLiked);
    } else if (culinaryPlan?.ingredients) {
      // Check favorites service for user-generated recipes
      const favorited = favoritesService.isFavorite(recipe.title, culinaryPlan.ingredients);
      setIsFavorited(favorited);
    }
  }, [recipe.title, culinaryPlan?.ingredients, externalIsLiked]);

  // If no videos available, show a beautiful gradient background instead
  const hasVideo = videoUrls.length > 0;
  
  // Get voiceover URL for this recipe
  const voiceoverUrl = culinaryPlan?.recipeVoiceovers?.[recipeIndex];
  const hasVoiceover = !!voiceoverUrl;
  
  // Store previous visibility state to detect changes
  const prevVisibleRef = useRef<boolean>(false);
  
  // Global audio manager - stop all other audio when this one starts
  useEffect(() => {
    if (isVisible && !prevVisibleRef.current) {
      // Recipe just became visible - immediately stop all other audio
      const stopAllAudioEvent = new CustomEvent('stopAllRecipeAudio', { 
        detail: { exceptIndex: recipeIndex, newVisibleIndex: recipeIndex } 
      });
      window.dispatchEvent(stopAllAudioEvent);
      console.log(`🛑 Stopping other audio - Recipe ${recipeIndex} (${recipe.title}) is now visible`);
    }
    // Note: prevVisibleRef is updated in the play/pause effect below
  }, [isVisible, recipeIndex, recipe.title]);
  
  // Listen for stop events from other recipe cards - IMMEDIATELY stop when another becomes visible
  useEffect(() => {
    const handleStopAudio = (event: CustomEvent) => {
      const exceptIndex = event.detail?.exceptIndex;
      const newVisibleIndex = event.detail?.newVisibleIndex;
      
      if (exceptIndex !== recipeIndex && newVisibleIndex !== recipeIndex) {
        // Another recipe became visible - IMMEDIATELY stop this one
        const audioElement = audioRef.current;
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
          setIsVoiceoverPlaying(false);
          console.log(`Recipe ${recipeIndex} (${recipe.title}) audio stopped - another recipe is visible`);
        }
      }
    };
    
    window.addEventListener('stopAllRecipeAudio', handleStopAudio as EventListener);
    return () => {
      window.removeEventListener('stopAllRecipeAudio', handleStopAudio as EventListener);
    };
  }, [recipeIndex, recipe.title]);

  // Video loading effect
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !hasVideo) return;

    const videoUrl = videoUrls[0];
    console.log('Loading video URL:', videoUrl);
    
    if (videoElement.src !== videoUrl) {
      // Add error handlers for debugging
      videoElement.onerror = (e) => {
        console.error('Video load error:', e);
        console.error('Video URL that failed:', videoUrl);
        console.error('Video error details:', videoElement.error);
      };
      
      videoElement.onloadstart = () => {
        console.log('Video loading started');
      };
      
      videoElement.onloadeddata = () => {
        console.log('Video data loaded successfully');
      };
      
      videoElement.oncanplay = () => {
        console.log('Video can play');
      };
      
      videoElement.src = videoUrl;
      videoElement.load(); // Explicitly load the video
      videoElement.play().catch(e => {
        console.error("Video play failed:", e);
        console.error("Video element error code:", videoElement.error?.code);
        console.error("Video element error message:", videoElement.error?.message);
      });
    }
  }, [videoUrls, hasVideo]);

  // Voiceover audio effect - load audio IMMEDIATELY and preload
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !hasVoiceover || !voiceoverUrl) return;

    // Load voiceover when available - ensure it's ready to play
    if (audioElement.src !== voiceoverUrl) {
      audioElement.src = voiceoverUrl;
      audioElement.volume = isVoiceoverMuted ? 0 : 0.7; // 70% volume
      audioElement.preload = 'auto'; // Preload for instant playback
      audioElement.loop = true; // Loop the audio to match video
      
      // Force load the audio
      audioElement.load();
      
      audioElement.oncanplay = () => {
        console.log(`✅ Voiceover audio ready for recipe ${recipeIndex}: ${recipe.title}`);
        // If this recipe is visible and audio just loaded, start playing
        if (isVisible && !isVoiceoverMuted) {
          audioElement.currentTime = 0;
          audioElement.play().catch(e => {
            console.log('Play after load prevented:', e);
          });
        }
      };
      
      audioElement.onerror = (e) => {
        console.error('❌ Voiceover audio error:', e);
      };
      
      audioElement.onloadeddata = () => {
        console.log(`📦 Audio data loaded for recipe ${recipeIndex}: ${recipe.title}`);
      };
    } else {
      // Audio source is already set - just update volume if needed
      audioElement.volume = isVoiceoverMuted ? 0 : 0.7;
    }
  }, [voiceoverUrl, hasVoiceover, isVoiceoverMuted, recipeIndex, recipe.title, isVisible]);

  // Play/pause voiceover based on visibility - INSTANT response when scrolling
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !hasVoiceover || !voiceoverUrl) return;

    const wasVisible = prevVisibleRef.current;
    const justBecameVisible = isVisible && !wasVisible;
    const justBecameHidden = !isVisible && wasVisible;

    if (justBecameVisible && !isVoiceoverMuted) {
      // Recipe just became visible - START PLAYING FROM BEGINNING IMMEDIATELY
      console.log(`🎵 STARTING audio for recipe ${recipeIndex}: ${recipe.title}`);
      
      // Always start from the beginning when scrolling to a new recipe
      audioElement.currentTime = 0;
      
      // Play immediately - prioritize speed
      const attemptPlay = () => {
        audioElement.currentTime = 0; // Ensure we start from beginning
        audioElement.play().then(() => {
          setIsVoiceoverPlaying(true);
          console.log(`✅ Audio NOW PLAYING for recipe ${recipeIndex}: ${recipe.title}`);
        }).catch(e => {
          console.log(`⚠️ Auto-play blocked for recipe ${recipeIndex} (may need user interaction):`, e);
        });
      };
      
      // Try to play immediately if ready
      if (audioElement.readyState >= 2) { // HAVE_CURRENT_DATA or better
        attemptPlay();
      } else {
        // Wait for audio to load, but play as soon as possible
        const handleLoadedData = () => {
          attemptPlay();
        };
        const handleCanPlay = () => {
          attemptPlay();
        };
        
        audioElement.addEventListener('loadeddata', handleLoadedData, { once: true });
        audioElement.addEventListener('canplay', handleCanPlay, { once: true });
        
        // Force load if not already loading
        if (audioElement.readyState === 0) {
          audioElement.load();
        }
      }
    } else if (justBecameHidden) {
      // Recipe just became hidden - IMMEDIATELY STOP
      console.log(`⏸️ STOPPING audio for recipe ${recipeIndex}: ${recipe.title}`);
      
      // Immediately pause and reset
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsVoiceoverPlaying(false);
    } else if (isVisible && !isVoiceoverMuted && audioElement.paused && !justBecameVisible) {
      // Recipe is visible but audio is paused (and we didn't just become visible) - resume playing
      audioElement.play().catch(e => {
        console.log(`Play failed for recipe ${recipeIndex}:`, e);
      });
    } else if (!isVisible && !audioElement.paused) {
      // Recipe is hidden but audio is playing - stop it
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsVoiceoverPlaying(false);
    }
    
    // Update previous visibility state
    prevVisibleRef.current = isVisible;
  }, [isVisible, hasVoiceover, voiceoverUrl, isVoiceoverMuted, hasVideo, recipeIndex, recipe.title]);

  // Handle audio playback events
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      setIsVoiceoverPlaying(true);
    };
    
    const handlePause = () => {
      setIsVoiceoverPlaying(false);
    };
    
    // Since we're looping, we don't need to handle 'ended'
    // But we'll keep it for safety
    const handleEnded = () => {
      // If audio ends (shouldn't happen with loop), restart it if visible
      if (isVisible && !isVoiceoverMuted) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.error('Restart audio failed:', e));
      }
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [isVisible, isVoiceoverMuted]);
  
  // Sync audio with video - monitor video playback and sync audio loops
  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;
    
    if (!videoElement || !audioElement || !hasVideo || !hasVoiceover || !isVisible) return;
    
    let lastVideoTime = 0;
    let syncTimeout: NodeJS.Timeout | null = null;
    
    const handleVideoTimeUpdate = () => {
      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;
      
      // Detect when video loops (currentTime jumps back to near 0)
      if (duration && lastVideoTime > duration - 0.3 && currentTime < 0.3) {
        // Video just looped - restart audio from beginning
        if (!isVoiceoverMuted) {
          audioElement.currentTime = 0;
          if (audioElement.paused) {
            audioElement.play().catch(e => console.error('Sync audio on video loop failed:', e));
          }
        }
      }
      
      lastVideoTime = currentTime;
      
      // Periodic sync check - ensure audio and video stay roughly in sync
      // Clear previous timeout
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      
      // Check sync every 2 seconds
      syncTimeout = setTimeout(() => {
        if (!audioElement.paused && !videoElement.paused) {
          // Both are playing - check if they're way out of sync
          const timeDiff = Math.abs(audioElement.currentTime - (currentTime % audioElement.duration));
          if (timeDiff > 1.0) {
            // More than 1 second out of sync - resync
            audioElement.currentTime = currentTime % audioElement.duration;
          }
        }
      }, 2000);
    };
    
    videoElement.addEventListener('timeupdate', handleVideoTimeUpdate);
    
    return () => {
      videoElement.removeEventListener('timeupdate', handleVideoTimeUpdate);
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [hasVideo, hasVoiceover, isVisible, isVoiceoverMuted]);

  const toggleVoiceover = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isVoiceoverPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch(e => console.error('Play failed:', e));
    }
  };

  const toggleVoiceoverMute = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newMuted = !isVoiceoverMuted;
    audioElement.volume = newMuted ? 0 : 0.7;
    setIsVoiceoverMuted(newMuted);
  };

  const handleVideoEnded = () => {
    // Loop the single video and sync audio
    if (videoRef.current && hasVideo) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      
      // Restart audio to sync with video loop
      if (audioRef.current && hasVoiceover && isVisible && !isVoiceoverMuted) {
        audioRef.current.currentTime = 0;
        if (audioRef.current.paused) {
          audioRef.current.play().catch(e => console.error('Restart audio on video loop failed:', e));
        }
      }
    }
  };
  
  const caption = storyboard?.caption;

  return (
    <div className="relative h-full w-full bg-black">
      {hasVideo ? (
        <>
          <video
            ref={videoRef}
            onEnded={handleVideoEnded}
            muted
            autoPlay
            playsInline
            loop
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
            preload="auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      )}
      
      <header className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Voiceover controls - only show if voiceover exists */}
        {hasVoiceover && (
          <div className="flex gap-1 bg-black/50 rounded-full p-1">
            <button
              onClick={toggleVoiceover}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title={isVoiceoverPlaying ? "Pause voiceover" : "Play voiceover"}
            >
              {isVoiceoverPlaying ? (
                <PauseIcon className="w-4 h-4 text-white" />
              ) : (
                <PlayIcon className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={toggleVoiceoverMute}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title={isVoiceoverMuted ? "Unmute voiceover" : "Mute voiceover"}
            >
              {isVoiceoverMuted ? (
                <VolumeOffIcon className="w-4 h-4 text-white" />
              ) : (
                <VolumeIcon className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        )}
      </header>
      
      {/* Recipe title overlay (bottom left) - with proper spacing from bottom */}
      <div className="absolute bottom-32 left-4 z-20 max-w-xs">
        <h3 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
          {recipe.title}
        </h3>
        {storyboard?.caption && (
          <p className="text-white text-sm opacity-90 drop-shadow-md">
            {storyboard.caption}
          </p>
        )}
      </div>

      {/* Interaction buttons (right side) - consistent with feed view */}
      <div className="absolute bottom-32 right-4 z-20 flex flex-col items-center gap-4">
        {/* Like button - works for both feed and generated recipes */}
        <button
          onClick={() => {
            if (!authService.isAuthenticated()) {
              setShowLoginPrompt(true);
              return;
            }

            if (onLike) {
              // Feed item - use parent's like handler
              onLike();
            } else if (culinaryPlan?.ingredients && culinaryPlan.ingredients.length > 0) {
              // User-generated recipe - use favorites service
              if (isFavorited) {
                favoritesService.removeFavorite(recipe.title, culinaryPlan.ingredients);
                setIsFavorited(false);
              } else {
                const voiceoverUrl = culinaryPlan?.recipeVoiceovers?.[recipeIndex];
                favoritesService.addFavorite(
                  recipe,
                  culinaryPlan.ingredients,
                  storyboard,
                  videoUrls,
                  voiceoverUrl
                );
                setIsFavorited(true);
              }
              onFavoriteChange?.();
            }
          }}
          className={`p-3 rounded-full transition-all duration-200 ${
            isFavorited
              ? 'bg-red-500/90 hover:bg-red-600 text-white'
              : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
          }`}
          title={isFavorited ? "Unlike" : "Like"}
        >
          {isFavorited ? (
            <HeartFilledIcon className="w-6 h-6" />
          ) : (
            <HeartIcon className="w-6 h-6" />
          )}
        </button>
        
        {/* Recipe button (book icon) - shows recipe details */}
        <button
          onClick={() => setIsDetailsVisible(!isDetailsVisible)}
          className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all duration-200"
          title="View recipe details"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
        
        {/* Share button */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: recipe.title,
                text: `Check out this recipe: ${recipe.title}`,
                url: window.location.href
              }).catch(() => {});
            } else {
              // Fallback: copy to clipboard
              navigator.clipboard.writeText(`${recipe.title} - ${window.location.href}`).then(() => {
                alert('Recipe link copied to clipboard!');
              });
            }
          }}
          className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all duration-200"
          title="Share recipe"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        
        {/* AI Assistant button */}
        {onOpenAgent && (
          <button
            onClick={() => onOpenAgent()}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all duration-200"
            title="Open AI Assistant"
          >
            <SparklesIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {/* Login prompt */}
      {showLoginPrompt && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 text-center">
            <HeartIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sign In to Save Favorites</h3>
            <p className="text-gray-600 mb-6">
              Create an account or sign in to save your favorite recipes and access them anytime.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  // Trigger login modal from parent
                  window.dispatchEvent(new CustomEvent('openLoginModal'));
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden audio element for voiceover */}
      {hasVoiceover && (
        <audio
          ref={audioRef}
          preload="auto"
          className="hidden"
        />
      )}


      {isDetailsVisible && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-40 p-4 sm:p-8 flex flex-col text-white overflow-y-auto pb-20">
          <header className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{recipe.title}</h1>
            <button onClick={() => setIsDetailsVisible(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <XIcon className="w-8 h-8"/>
            </button>
          </header>
          <div className="flex-grow overflow-y-auto pb-4">
            <div className="flex items-center space-x-6 my-4 border-t border-b border-gray-700 py-3">
              <div className="flex items-center space-x-2"><ClockIcon className="w-5 h-5 text-indigo-400" /><span>{recipe.time_minutes} min</span></div>
              <div className="flex items-center space-x-2"><BarChartIcon className="w-5 h-5 text-indigo-400" /><span className="capitalize">{recipe.difficulty}</span></div>
            </div>
            <h2 className="text-2xl font-semibold flex items-center gap-3 mt-6 mb-3"><ListIcon className="w-6 h-6 text-indigo-400"/>Steps</h2>
            <ol className="list-decimal list-inside space-y-3 bg-gray-800/50 p-4 rounded-lg">
              {recipe.steps.map((step, index) => <li key={index}>{step}</li>)}
            </ol>
            {recipe.missing_items.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg">Optional Extras:</h3>
                <p className="text-gray-400">{recipe.missing_items.join(', ')}</p>
              </div>
            )}
            {storyboard?.voiceover_script && (
                <div className="mt-6">
                    <h3 className="font-semibold text-lg">Voiceover Script:</h3>
                    <p className="text-gray-400 italic">"{storyboard.voiceover_script}"</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
