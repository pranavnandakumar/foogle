import React, { useState, useEffect, useRef } from 'react';
import type { Recipe, Storyboard } from '../types';
import { ChefHatIcon, ClockIcon, BarChartIcon, ListIcon, XIcon } from './Icons';

interface FullScreenRecipeCardProps {
  recipe: Recipe;
  storyboard?: Storyboard;
  videoUrls: string[];
  onReset: () => void;
}

export const FullScreenRecipeCard: React.FC<FullScreenRecipeCardProps> = ({ recipe, storyboard, videoUrls, onReset }) => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || videoUrls.length === 0) return;

    const videoUrl = videoUrls[currentClipIndex];
    if (videoElement.src !== videoUrl) {
      videoElement.src = videoUrl;
      videoElement.play().catch(e => console.error("Video play failed:", e));
    }
  }, [currentClipIndex, videoUrls]);

  const handleVideoEnded = () => {
    // Loop if only one video, otherwise cycle through the clips.
    const nextIndex = videoUrls.length > 1 ? (currentClipIndex + 1) % videoUrls.length : 0;
    setCurrentClipIndex(nextIndex);
  };
  
  const currentScene = storyboard?.scenes[currentClipIndex];
  const caption = currentScene?.caption;

  if (videoUrls.length === 0) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <h2 className="text-xl font-bold">No video to display</h2>
            <p className="text-gray-400">Placeholder videos could not be loaded.</p>
        </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        key={currentClipIndex}
        onEnded={handleVideoEnded}
        muted
        autoPlay
        playsInline
        loop={videoUrls.length === 1} // Only loop if it's a single video
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      <header className="absolute top-4 right-4 z-10">
         <button
            onClick={onReset}
            className="bg-black/50 hover:bg-indigo-600 text-white font-bold p-2 rounded-full transition-colors duration-300"
            title="Start Over"
        >
            <ChefHatIcon className="w-6 h-6"/>
        </button>
      </header>

      <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white z-10">
        {caption && <p className="text-center font-bold mb-4 bg-black/50 py-1 px-3 rounded-full inline-block">{caption}</p>}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">{recipe.title}</h1>
        {storyboard?.hook && <p className="mt-2 text-lg text-indigo-300 font-semibold italic drop-shadow-md">"{storyboard.hook}"</p>}
        <button 
          onClick={() => setIsDetailsVisible(true)}
          className="mt-4 flex items-center justify-center px-4 py-2 font-semibold bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors"
        >
            <ListIcon className="w-5 h-5"/>
            <span className="ml-2">View Recipe</span>
        </button>
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
