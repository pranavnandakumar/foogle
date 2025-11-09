import React, { useState, useEffect, useRef } from 'react';
import type { Recipe, Storyboard, CulinaryPlan } from '../types';
import { ChefHatIcon, ClockIcon, BarChartIcon, ListIcon, XIcon, SparklesIcon, VolumeIcon, VolumeOffIcon, PlayIcon, PauseIcon } from './Icons';

interface FullScreenRecipeCardProps {
  recipe: Recipe;
  storyboard?: Storyboard;
  videoUrls: string[];
  onReset: () => void;
  onOpenAgent?: () => void;
  culinaryPlan?: CulinaryPlan;
  isVisible?: boolean;
  recipeIndex?: number;
}

export const FullScreenRecipeCard: React.FC<FullScreenRecipeCardProps> = ({ 
  recipe, 
  storyboard, 
  videoUrls, 
  onReset, 
  onOpenAgent, 
  culinaryPlan,
  isVisible = false,
  recipeIndex = 0
}) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isVoiceoverPlaying, setIsVoiceoverPlaying] = useState(false);
  const [isVoiceoverMuted, setIsVoiceoverMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
        {/* Voiceover controls */}
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
        <button
          onClick={onReset}
          className="bg-black/50 hover:bg-indigo-600 text-white font-bold p-2 rounded-full transition-colors duration-300"
          title="Start Over"
        >
          <ChefHatIcon className="w-6 h-6"/>
        </button>
      </header>
      
      {/* Hidden audio element for voiceover */}
      {hasVoiceover && (
        <audio
          ref={audioRef}
          preload="auto"
          className="hidden"
        />
      )}

      <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white z-10">
        {caption && <p className="text-center font-bold mb-4 bg-black/50 py-1 px-3 rounded-full inline-block">{caption}</p>}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">{recipe.title}</h1>
        {storyboard?.hook && <p className="mt-2 text-lg text-indigo-300 font-semibold italic drop-shadow-md">"{storyboard.hook}"</p>}
        <div className="mt-4 flex gap-2 flex-wrap">
          <button 
            onClick={() => setIsDetailsVisible(true)}
            className="flex items-center justify-center px-4 py-2 font-semibold bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors"
          >
              <ListIcon className="w-5 h-5"/>
              <span className="ml-2">View Recipe</span>
          </button>
          {onOpenAgent && (
            <button 
              onClick={onOpenAgent}
              className="flex items-center justify-center px-4 py-2 font-semibold bg-indigo-600/80 backdrop-blur-md rounded-lg hover:bg-indigo-700/80 transition-colors"
            >
                <SparklesIcon className="w-5 h-5"/>
                <span className="ml-2">AI Assistant</span>
            </button>
          )}
        </div>
      </footer>

      {isDetailsVisible && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md z-20 p-4 sm:p-8 flex flex-col text-white overflow-y-auto">
          <header className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{recipe.title}</h1>
            <button onClick={() => setIsDetailsVisible(false)} className="p-2">
              <XIcon className="w-8 h-8"/>
            </button>
          </header>
          <div className="flex-grow overflow-y-auto">
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
