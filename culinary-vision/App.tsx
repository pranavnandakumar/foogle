import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { RecipeScroller } from './components/RecipeScroller';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CookingAgent } from './components/CookingAgent';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginModal } from './components/LoginModal';
import { FavoritesView } from './components/FavoritesView';
import { FeedView } from './components/FeedView';
import { BottomNavigation, type NavigationTab } from './components/BottomNavigation';
import { generateCulinaryPlan, generateAllRecipeVideos } from './services/geminiService';
import { generateRecipeVoiceover } from './services/elevenLabsService';
import { authService } from './services/authService';
import { favoritesService } from './services/favoritesService';
import { feedService } from './services/feedService';
import type { CulinaryPlan, AgentContext, Storyboard } from './types';
import { ChefHatIcon, ErrorIcon, HeartFilledIcon, UserIcon, LogoutIcon } from './components/Icons';

enum AppState {
  UPLOADING,
  GENERATING,
  GENERATING_VIDEOS,
  DISPLAYING_RECIPES,
  ERROR,
}

export default function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<NavigationTab>('upload');
  const [appState, setAppState] = useState<AppState>(AppState.UPLOADING);
  const [culinaryPlan, setCulinaryPlan] = useState<CulinaryPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<string>('');
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState<number>(0);
  const [totalRecipes, setTotalRecipes] = useState<number>(0);
  const [currentTip, setCurrentTip] = useState<string>('');
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [favoritesCulinaryPlan, setFavoritesCulinaryPlan] = useState<CulinaryPlan | null>(null);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication and load user on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setFavoriteCount(favoritesService.getFavoriteCount());
    }
  }, []);

  // Listen for login modal open event
  useEffect(() => {
    const handleOpenLogin = () => {
      setIsLoginModalOpen(true);
    };
    window.addEventListener('openLoginModal', handleOpenLogin);
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLogin);
    };
  }, []);

  // Handle user login
  const handleLogin = useCallback((loggedInUser: any) => {
    setUser(loggedInUser);
    setFavoriteCount(favoritesService.getFavoriteCount());
    setIsLoginModalOpen(false);
  }, []);

  // Handle user logout
  const handleLogout = useCallback(() => {
    authService.signOut();
    setUser(null);
    setFavoriteCount(0);
    // If on favorites tab, switch to upload
    if (activeTab === 'favorites') {
      setActiveTab('upload');
    }
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = useCallback((tab: NavigationTab) => {
    setActiveTab(tab);
    
    // If switching to upload and we're in an error state, reset
    if (tab === 'upload' && appState === AppState.ERROR) {
      setError(null);
      setAppState(AppState.UPLOADING);
    }
  }, [appState]);

  // Handle favorite change
  const handleFavoriteChange = useCallback(() => {
    if (user) {
      setFavoriteCount(favoritesService.getFavoriteCount());
    }
  }, [user]);

  // Rotating cooking tips
  const cookingTips = [
    "Adding a pinch of sugar to tomato-based sauces can help balance the acidity.",
    "Let meat rest for a few minutes after cooking to retain juices and improve flavor.",
    "Use a microplane to grate garlic and ginger for more intense flavor distribution.",
    "Toast spices in a dry pan before grinding to unlock their full aromatic potential.",
    "Add a splash of vinegar or lemon juice at the end of cooking to brighten flavors.",
    "Salt your pasta water generously - it should taste like the sea.",
    "Pat proteins dry before searing to achieve that perfect golden-brown crust.",
    "Don't overcrowd the pan - give ingredients space to caramelize properly.",
    "Taste as you cook and adjust seasonings gradually throughout the process.",
    "Keep your knives sharp - a sharp knife is safer and makes prep work easier.",
    "Store fresh herbs like a bouquet in a glass of water in the refrigerator.",
    "Use the right size pot or pan - too big or too small affects cooking results."
  ];

  // Rotate tips during video generation
  useEffect(() => {
    if (appState === AppState.GENERATING_VIDEOS) {
      setCurrentTip(cookingTips[0]);
      let tipIndex = 0;
      
      tipIntervalRef.current = setInterval(() => {
        tipIndex = (tipIndex + 1) % cookingTips.length;
        setCurrentTip(cookingTips[tipIndex]);
      }, 4000); // Change tip every 4 seconds
      
      return () => {
        if (tipIntervalRef.current) {
          clearInterval(tipIntervalRef.current);
          tipIntervalRef.current = null;
        }
      };
    }
  }, [appState]);

  const handleImageUpload = useCallback(async (file: File, testMode: boolean = false) => {
    try {
      setAppState(AppState.GENERATING);
      setImagePreview(URL.createObjectURL(file));

      const plan = await generateCulinaryPlan(file);
      setCulinaryPlan(plan);
      setTotalRecipes(plan.recipes.length);
      setCurrentRecipeIndex(0);
      
      // Test mode: Skip video generation and use placeholder content
      if (testMode) {
        console.log('🧪 Test Mode: Skipping video generation, using placeholder content');
        setVideoProgress('');
        
        // Create placeholder storyboards for all recipes with more detailed content
        const placeholderStoryboards: { [recipeIndex: number]: Storyboard } = {};
        plan.recipes.forEach((recipe, index) => {
          // Generate creative hooks and descriptions based on recipe
          const hooks = [
            `Transform your ingredients into ${recipe.title}!`,
            `Whip up ${recipe.title} in just ${recipe.time_minutes} minutes!`,
            `Discover the secret to perfect ${recipe.title}!`,
            `${recipe.title} - quick, easy, and delicious!`,
            `Master ${recipe.title} with this simple recipe!`
          ];
          
          const hook = hooks[index % hooks.length];
          const mainIngredient = plan.ingredients[0] || 'ingredients';
          
          // Create more specific voiceover script mentioning the dish name and details
          const stepsPreview = recipe.steps.slice(0, 2).join(', then ');
          placeholderStoryboards[index] = {
            hook: hook,
            voiceover_script: `Let's make ${recipe.title}! This ${recipe.difficulty} ${recipe.time_minutes}-minute recipe is so easy. ${stepsPreview}. Ready in just ${recipe.time_minutes} minutes - let's cook!`,
            video_description: `A fast-paced cooking video showing the preparation of ${recipe.title}. The video starts with a close-up of fresh ${mainIngredient}, then shows quick cuts of mixing, cooking, and plating. On-screen text displays the recipe name and key steps. The video has a vibrant, energetic feel perfect for social media.`,
            caption: recipe.title
          };
        });
        
        // Generate voiceovers for all recipes (even in test mode for better experience)
        setVideoProgress('🎤 Generating voiceovers...');
        const recipeVoiceovers: { [recipeIndex: number]: string } = {};
        
        for (let i = 0; i < plan.recipes.length; i++) {
          try {
            const storyboard = placeholderStoryboards[i];
            if (storyboard?.voiceover_script) {
              setVideoProgress(`🎤 Generating voiceover for: ${plan.recipes[i].title}`);
              const voiceoverUrl = await generateRecipeVoiceover(storyboard.voiceover_script);
              recipeVoiceovers[i] = voiceoverUrl;
              console.log(`Voiceover generated for recipe ${i}: ${plan.recipes[i].title}`);
            }
          } catch (error) {
            console.warn(`Failed to generate voiceover for recipe ${i}:`, error);
            // Continue without voiceover for this recipe
          }
        }
        
        // Use empty video arrays (will show beautiful gradient backgrounds)
        const updatedPlan: CulinaryPlan = {
          ...plan,
          videoUrls: [],
          recipeVideos: {},
          recipeStoryboards: placeholderStoryboards,
          recipeVoiceovers: recipeVoiceovers
        };
        setCulinaryPlan(updatedPlan);
        setAppState(AppState.DISPLAYING_RECIPES);
        console.log('🧪 Test Mode: Recipes ready with placeholder storyboards and voiceovers');
        
        // Add user-generated recipes to feed (test mode)
        setTimeout(() => {
          for (let i = 0; i < plan.recipes.length; i++) {
            const recipe = plan.recipes[i];
            const storyboard = placeholderStoryboards[i];
            const voiceoverUrl = recipeVoiceovers[i];
            
            // Infer tags from recipe
            const tags = feedService.inferTags(recipe);
            
            // Add to feed (test mode - no video URL)
            feedService.addUserRecipe(
              recipe,
              storyboard,
              undefined,
              voiceoverUrl,
              tags
            );
          }
          
          // Refresh feed to include new recipes
          feedService.refreshFeed(10);
        }, 0);
        
        return;
      }
      
      // Try to generate videos for all recipes, but don't fail if it doesn't work
      // Video generation is optional - recipes can be viewed without videos
      try {
        setAppState(AppState.GENERATING_VIDEOS);
        setIsGeneratingVideos(true);
        const onProgress = (message: string, current: number, total: number) => {
          // Ensure message is always a string
          const progressMessage = typeof message === 'string' ? message : String(message || 'Processing...');
          setVideoProgress(progressMessage);
          setCurrentRecipeIndex(current);
          setTotalRecipes(total);
        };
        
        const { recipeVideos, recipeStoryboards, quotaExceeded } = await generateAllRecipeVideos(plan.recipes, onProgress);
        console.log('Video generation complete. Recipe videos:', recipeVideos);
        console.log('Recipe storyboards:', recipeStoryboards);
        console.log('Quota exceeded:', quotaExceeded);
        
        if (quotaExceeded) {
          console.warn('Video generation quota was exceeded. Recipes are available without videos.');
          setVideoProgress('⚠️ Video quota exceeded. Generating voiceovers...');
        } else {
          setVideoProgress('🎤 Generating voiceovers for recipes...');
        }
        
        // Generate voiceovers for all recipes (even if videos failed)
        const recipeVoiceovers: { [recipeIndex: number]: string } = {};
        
        for (let i = 0; i < plan.recipes.length; i++) {
          try {
            // Use generated storyboard if available, otherwise use original
            const storyboard = recipeStoryboards[i] || (i === 0 ? plan.storyboard : undefined);
            
            if (storyboard?.voiceover_script) {
              onProgress(`🎤 Generating voiceover: ${plan.recipes[i].title}`, i + 1, plan.recipes.length);
              const voiceoverUrl = await generateRecipeVoiceover(storyboard.voiceover_script);
              recipeVoiceovers[i] = voiceoverUrl;
              console.log(`Voiceover generated for recipe ${i}: ${plan.recipes[i].title}`);
            }
          } catch (error) {
            console.warn(`Failed to generate voiceover for recipe ${i}:`, error);
            // Continue without voiceover for this recipe
          }
        }
        
        // Keep legacy videoUrls and storyboard for first recipe for backward compatibility
        // Ensure all values are properly formatted
        const updatedPlan: CulinaryPlan = { 
          ...plan, 
          videoUrls: Array.isArray(recipeVideos[0]) ? recipeVideos[0] : [],
          recipeVideos: recipeVideos || {},
          recipeStoryboards: recipeStoryboards || {},
          recipeVoiceovers: recipeVoiceovers
        };
        setCulinaryPlan(updatedPlan);
        console.log('Updated plan with recipeVideos, recipeStoryboards, and recipeVoiceovers:', updatedPlan.recipeVideos);
        
        // Add user-generated recipes to feed (in parallel, doesn't block)
        setTimeout(() => {
          for (let i = 0; i < plan.recipes.length; i++) {
            const recipe = plan.recipes[i];
            const storyboard = recipeStoryboards[i] || (i === 0 ? plan.storyboard : undefined);
            const videoUrl = recipeVideos[i] && recipeVideos[i].length > 0 ? recipeVideos[i][0] : undefined;
            const voiceoverUrl = recipeVoiceovers[i];
            
            // Infer tags from recipe
            const tags = feedService.inferTags(recipe);
            
            // Add to feed
            feedService.addUserRecipe(
              recipe,
              storyboard,
              videoUrl,
              voiceoverUrl,
              tags
            );
          }
          
          // Refresh feed to include new recipes
          feedService.refreshFeed(10);
        }, 0);
        
        if (quotaExceeded) {
          setVideoProgress('⚠️ Videos unavailable, but voiceovers are ready!');
        } else {
          setVideoProgress('');
        }
      } catch (videoError: any) {
        // Video generation failed (quota, API issues, etc.) but we continue anyway
        console.warn('Video generation failed, continuing without videos:', videoError);
        console.warn('Error details:', videoError instanceof Error ? videoError.message : videoError);
        
        // Check if it's a quota error
        const isQuotaError = videoError?.isQuotaError || 
          (videoError instanceof Error && (
            videoError.message.includes("QUOTA_EXCEEDED") ||
            videoError.message.includes("quota") ||
            videoError.message.includes("429")
          ));
        
        if (isQuotaError) {
          setVideoProgress('⚠️ Video quota exceeded. Recipes available without videos.');
        } else {
          setVideoProgress('');
        }
        
        // Generate voiceovers even if video generation failed
        setVideoProgress('🎤 Generating voiceovers...');
        const recipeVoiceovers: { [recipeIndex: number]: string } = {};
        
        for (let i = 0; i < plan.recipes.length; i++) {
          try {
            const storyboard = i === 0 ? plan.storyboard : undefined;
            if (storyboard?.voiceover_script) {
              setVideoProgress(`🎤 Generating voiceover: ${plan.recipes[i].title}`);
              const voiceoverUrl = await generateRecipeVoiceover(storyboard.voiceover_script);
              recipeVoiceovers[i] = voiceoverUrl;
            }
          } catch (error) {
            console.warn(`Failed to generate voiceover for recipe ${i}:`, error);
          }
        }
        
        // Continue with recipes without videos - will show gradient background
        const updatedPlan: CulinaryPlan = { 
          ...plan, 
          videoUrls: [],
          recipeVideos: {},
          recipeStoryboards: {},
          recipeVoiceovers: recipeVoiceovers
        };
        setCulinaryPlan(updatedPlan);
        setVideoProgress(isQuotaError ? '⚠️ Videos unavailable, but voiceovers are ready!' : '');
        
        // Add user-generated recipes to feed (even without videos)
        setTimeout(() => {
          for (let i = 0; i < plan.recipes.length; i++) {
            const recipe = plan.recipes[i];
            const storyboard = i === 0 ? plan.storyboard : undefined;
            const voiceoverUrl = recipeVoiceovers[i];
            
            // Infer tags from recipe
            const tags = feedService.inferTags(recipe);
            
            // Add to feed (without video URL since generation failed)
            feedService.addUserRecipe(
              recipe,
              storyboard,
              undefined, // No video URL
              voiceoverUrl,
              tags
            );
          }
          
          // Refresh feed to include new recipes
          feedService.refreshFeed(10);
        }, 0);
      } finally {
        // Always transition to displaying recipes, even if video generation failed
        setIsGeneratingVideos(false);
        setAppState(AppState.DISPLAYING_RECIPES);
      }

    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unknown error occurred. Please try again.'
      );
      setAppState(AppState.ERROR);
    }
  }, []);
  
  const handleTestMode = useCallback((file: File) => {
    handleImageUpload(file, true);
  }, [handleImageUpload]);

  const handleReset = useCallback(() => {
    setAppState(AppState.UPLOADING);
    setCulinaryPlan(null);
    setError(null);
    setImagePreview(null);
    setVideoProgress('');
    setCurrentRecipeIndex(0);
    setTotalRecipes(0);
    setActiveTab('upload');
  }, []);

  const handleShowFavorites = useCallback(() => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setActiveTab('favorites');
  }, [user]);

  const renderContent = () => {
    // Handle tab-based navigation
    if (activeTab === 'feed') {
      return (
        <div className="h-screen w-screen bg-black">
          <FeedView 
            onRecipeLike={(feedItem) => {
              console.log('Recipe liked in feed:', feedItem.recipe.title);
              handleFavoriteChange();
            }}
            onOpenAgent={(plan) => {
              setCulinaryPlan(plan);
              setIsAgentOpen(true);
            }}
          />
          {isAgentOpen && culinaryPlan && (
            <CookingAgent
              context={{
                recipes: culinaryPlan.recipes,
                ingredients: culinaryPlan.ingredients || [],
                culinaryPlan: culinaryPlan
              }}
              onClose={() => {
                setIsAgentOpen(false);
                setCulinaryPlan(null);
              }}
            />
          )}
        </div>
      );
    }

    if (activeTab === 'favorites') {
      return (
        <div className="h-screen w-screen bg-white pb-16">
          <FavoritesView
            onBack={() => setActiveTab('upload')}
            onOpenAgent={(plan) => {
              setFavoritesCulinaryPlan(plan);
              setIsAgentOpen(true);
            }}
            onFavoriteChange={handleFavoriteChange}
          />
          {isAgentOpen && favoritesCulinaryPlan && (
            <CookingAgent
              context={{
                recipes: favoritesCulinaryPlan.recipes,
                ingredients: favoritesCulinaryPlan.ingredients || [],
                culinaryPlan: favoritesCulinaryPlan
              }}
              onClose={() => {
                setIsAgentOpen(false);
                setFavoritesCulinaryPlan(null);
              }}
            />
          )}
        </div>
      );
    }

    // Upload tab content
    switch (appState) {
      case AppState.UPLOADING:
        return (
          <div className="h-screen w-screen bg-teal-50 pb-16">
            <ImageUploader onImageUpload={handleImageUpload} onTestMode={handleTestMode} />
          </div>
        );
      case AppState.GENERATING:
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-white p-4">
            <LoadingSpinner />
            <h2 className="text-xl font-normal mt-6 text-gray-900">
              Analyzing your ingredients
            </h2>
            <p className="text-gray-600 mt-2 text-center">
              Crafting personalized recipes just for you...
            </p>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Uploaded ingredients"
                className="mt-8 rounded-lg max-h-64 shadow-md object-cover border border-gray-200"
              />
            )}
          </div>
        );
      case AppState.GENERATING_VIDEOS:
        // Show loading state on upload tab during generation
        return (
          <div className="h-screen w-screen bg-teal-50 pb-16 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="bg-teal-500 text-white p-6 rounded-t-lg">
                <h2 className="text-2xl font-bold text-center">Chef is cooking!</h2>
              </div>
              
              {/* Progress bar */}
              {totalRecipes > 0 && (
                <div className="bg-white p-4">
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(((currentRecipeIndex + 1) / totalRecipes) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600">
                    {currentRecipeIndex + 1} of {totalRecipes} recipes
                  </p>
                </div>
              )}
              
              {/* Tips and facts */}
              <div className="bg-gray-50 p-4 space-y-3">
                {currentTip && (
                  <div className="bg-teal-50 border-2 border-teal-500 rounded-lg p-4">
                    <h3 className="text-green-600 font-bold text-sm mb-2">Cooking tip!</h3>
                    <p className="text-gray-700 text-sm">{currentTip}</p>
                  </div>
                )}
                <div className="bg-teal-50 border-2 border-teal-500 rounded-lg p-4">
                  <h3 className="text-green-600 font-bold text-sm mb-2">Fun fact:</h3>
                  <p className="text-gray-700 text-sm">
                    {cookingTips[Math.floor(Math.random() * cookingTips.length)]}
                  </p>
                </div>
              </div>
              
              <div className="bg-teal-500 p-4 text-center rounded-b-lg">
                <p className="text-white text-sm">
                  Switch to the Feed tab to browse recipes while we generate your videos!
                </p>
              </div>
            </div>
          </div>
        );
      case AppState.DISPLAYING_RECIPES:
        if (!culinaryPlan) {
          return (
            <div className="flex flex-col items-center justify-center h-screen bg-white p-4">
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          );
        }
        
        // Ensure culinaryPlan has valid recipes
        if (!culinaryPlan.recipes || !Array.isArray(culinaryPlan.recipes) || culinaryPlan.recipes.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-screen bg-white p-4">
              <p className="text-gray-600">No recipes available. Please try again.</p>
              <button
                onClick={handleReset}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          );
        }
        
        return (
          <div className="h-screen w-screen bg-black">
            <RecipeScroller 
              plan={culinaryPlan} 
              onReset={() => setActiveTab('upload')}
              onOpenAgent={() => setIsAgentOpen(true)}
              onFavoriteChange={handleFavoriteChange}
            />
            {isAgentOpen && (
              <CookingAgent
                context={{
                  recipes: culinaryPlan.recipes,
                  ingredients: culinaryPlan.ingredients || [],
                  culinaryPlan: culinaryPlan
                }}
                onClose={() => setIsAgentOpen(false)}
              />
            )}
          </div>
        );
      case AppState.ERROR:
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-white text-center p-4">
            <ErrorIcon className="w-16 h-16 text-red-500" />
            <h2 className="text-2xl font-normal mt-4 text-gray-900">
              Something went wrong
            </h2>
            <p className="text-gray-600 mt-2 max-w-md">{error}</p>
            <p className="text-gray-500 mt-2 text-sm max-w-md">Note: Video generation may fail if quota is exceeded. Recipes are still available without videos.</p>
            <button
              onClick={handleReset}
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors duration-200 flex items-center gap-2"
            >
              <ChefHatIcon className="w-5 h-5"/>
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <main className="h-screen w-screen bg-white relative">
        {renderContent()}
        
        {/* Bottom Navigation - Always visible */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          favoriteCount={favoriteCount}
          user={user}
          onLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />
      </main>
      
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </ErrorBoundary>
  );
}
