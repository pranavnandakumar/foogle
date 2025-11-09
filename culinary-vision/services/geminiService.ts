import { GoogleGenAI, Type } from '@google/genai';
import type { CulinaryPlan, Recipe, Storyboard } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const CULINARY_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lowercase, singular ingredient names identified from the image."
    },
    recipes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Fun & catchy, <= 6 words" },
          time_minutes: { type: Type.INTEGER, description: "<= 25" },
          difficulty: { type: Type.STRING, description: "Should be 'easy'" },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5–8 short steps, imperative tense, <= 12 words"
          },
          missing_items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "0-2 optional extras"
          }
        },
        required: ["title", "time_minutes", "difficulty", "steps", "missing_items"]
      }
    },
    storyboard: {
      type: Type.OBJECT,
      properties: {
        hook: { type: Type.STRING, description: "One-sentence attention grabber" },
        voiceover_script: { type: Type.STRING, description: "Natural narration for 10-second video, ~30-40 words" },
        video_description: { type: Type.STRING, description: "Detailed description of the 10-second cooking video, covering key steps and visual elements" },
        caption: { type: Type.STRING, description: "Main on-screen text/caption for the video" }
      },
      required: ["hook", "voiceover_script", "video_description", "caption"]
    },
  },
  required: ["ingredients", "recipes", "storyboard"]
};

const ensureApiKey = async (): Promise<string> => {
    // This function ensures an API key is available for Veo, prompting the user if necessary.
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        let hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
        // After the dialog, process.env.API_KEY should be populated.
        // We throw an error if it's still missing, preventing the app from hanging.
        if (process.env.API_KEY) {
            return process.env.API_KEY;
        } else {
            throw new Error("API key selection was cancelled or failed. Please try again.");
        }
    } else if (process.env.API_KEY) {
        return process.env.API_KEY;
    }
    
    throw new Error("API key is not configured or could not be obtained.");
};


export const generateCulinaryPlan = async (imageFile: File): Promise<CulinaryPlan> => {
  // Use a default API key for text generation as it doesn't require the same setup as Veo.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `You are a culinary assistant and short-form recipe video generator.
  
### STEP 1 — INGREDIENTS
Given the uploaded image, identify only edible ingredients. Ignore containers, brands, packaging text, and kitchen items.
Return ingredients as a JSON array of lowercase singular ingredient names.

### STEP 2 — RECIPE OPTIONS
Using only these ingredients plus basic pantry staples (salt, pepper, oil, water), propose 3 recipe ideas.
For each recipe, provide:
- title (fun & catchy, <= 6 words)
- time_minutes (<= 25)
- difficulty: "easy"
- steps: 5–8 short steps, each imperative tense and <= 12 words
- missing_items: at most 0–2 optional extras

### STEP 3 — STORYBOARD GENERATION (FOR THE FIRST RECIPE)
Take the FIRST recipe you listed and generate a single 10-second vertical video storyboard.
Provide:
- "hook": "One-sentence attention grabber, fun, casual"
- "voiceover_script": "Natural narration for 10-second video, ~30-40 words, casual like TikTok"
- "video_description": "Detailed description of the cooking video covering the key visual steps and actions that will happen in 10 seconds. Include transitions between steps."
- "caption": "Main on-screen text/caption that will appear during the video (keep it short and punchy)"

### OUTPUT FORMAT (IMPORTANT)
Return a single, valid JSON object matching the provided schema. Do not add explanations or commentary.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, {text: prompt}] },
    config: {
        responseMimeType: "application/json",
        responseSchema: CULINARY_PLAN_SCHEMA,
    }
  });

  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText) as CulinaryPlan;
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", jsonText);
    throw new Error("The AI returned an invalid response. This can happen with complex images. Please try a different image or try again.");
  }
};

// Generate a storyboard for a recipe (used when generating videos for all recipes)
const generateRecipeStoryboard = async (recipe: Recipe, apiKey: string): Promise<Storyboard> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Generate a 10-second vertical video storyboard for this recipe: "${recipe.title}"

Recipe details:
- Time: ${recipe.time_minutes} minutes
- Difficulty: ${recipe.difficulty}
- Steps: ${recipe.steps.join('. ')}

Create an engaging, specific voiceover that:
1. Mentions the dish name "${recipe.title}" clearly
2. Highlights the time (${recipe.time_minutes} minutes) and difficulty
3. Describes 2-3 key steps from the recipe
4. Uses a casual, energetic tone like TikTok/Instagram Reels
5. Is exactly 8-12 seconds when spoken (aim for 25-35 words)

Provide:
- "hook": "One-sentence attention grabber mentioning the dish name, fun, casual"
- "voiceover_script": "Specific narration mentioning "${recipe.title}" by name, the ${recipe.time_minutes}-minute time, and key cooking steps. Should be 25-35 words, casual and energetic, perfect for a short cooking video."
- "video_description": "Detailed description of the cooking video covering the key visual steps and actions that will happen in 10 seconds. Include transitions between steps."
- "caption": "Main on-screen text/caption - the dish name "${recipe.title}" (keep it short and punchy)"

Return JSON with these fields.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text) as Storyboard;
};

export const generateRecipeVideos = async (
  storyboard: Storyboard, 
  recipe: Recipe, 
  onProgress?: (message: string) => void,
  retryCount: number = 0
): Promise<string[]> => {
  const apiKey = await ensureApiKey();
  
  onProgress?.(`Preparing to generate your 10-second cooking video...`);
  await new Promise(resolve => setTimeout(resolve, 1500)); 

  onProgress?.(`🎬 Creating video for: "${recipe.title}"`);

  // Build a comprehensive prompt for a 10-second video
  const videoPrompt = `A cinematic, high-quality cooking video, vertical 9:16 aspect ratio, exactly 10 seconds long. Recipe: "${recipe.title}". 

Video description: ${storyboard.video_description}

Key elements:
- Show the main cooking steps in a fast-paced, engaging way
- On-screen text: "${storyboard.caption}"
- Vertical format optimized for mobile viewing
- Minimalist, clean kitchen setting
- Smooth transitions between steps
- Close-up shots of ingredients and cooking actions
- Visual appeal and professional quality

Make it engaging and TikTok-style, showing the essence of the recipe in 10 seconds.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    onProgress?.(`🎥 Generating your 10-second video... this can take a minute.`);
    
    let operation;
    try {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });
    } catch (initError: any) {
      // Check if the initial call failed with quota error
      console.error('Error in initial generateVideos call:', initError);
      const initErrorMsg = (initError?.message || JSON.stringify(initError) || '').toLowerCase();
      if (initErrorMsg.includes('quota') || initErrorMsg.includes('429') || initErrorMsg.includes('resource_exhausted')) {
        const quotaError = new Error("QUOTA_EXCEEDED");
        (quotaError as any).isQuotaError = true;
        (quotaError as any).originalError = initError;
        throw quotaError;
      }
      throw initError; // Re-throw if not quota error
    }
    
    // Check if operation has an error field (quota errors can appear here)
    if ((operation as any)?.error) {
      const opError = (operation as any).error;
      const opErrorMsg = (opError?.message || JSON.stringify(opError) || '').toLowerCase();
      if (opErrorMsg.includes('quota') || opErrorMsg.includes('429') || opErrorMsg.includes('resource_exhausted')) {
        const quotaError = new Error("QUOTA_EXCEEDED");
        (quotaError as any).isQuotaError = true;
        (quotaError as any).originalError = opError;
        throw quotaError;
      }
    }
    
    let pollCount = 0;
    const maxPolls = 60; // 10 minutes max (60 * 10 seconds)
    
    while (!operation.done) {
      if (pollCount >= maxPolls) {
        throw new Error("Video generation is taking too long. Please try again with a simpler recipe or check your API quota.");
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      pollCount++;
      
      try {
        operation = await ai.operations.getVideosOperation({operation: operation});
        
        // Check for errors in operation response
        if ((operation as any)?.error) {
          const opError = (operation as any).error;
          const opErrorMsg = (opError?.message || JSON.stringify(opError) || '').toLowerCase();
          if (opErrorMsg.includes('quota') || opErrorMsg.includes('429') || opErrorMsg.includes('resource_exhausted')) {
            const quotaError = new Error("QUOTA_EXCEEDED");
            (quotaError as any).isQuotaError = true;
            (quotaError as any).originalError = opError;
            throw quotaError;
          }
          // If it's a different error, throw it
          throw new Error(opError?.message || 'Operation failed');
        }
        
        onProgress?.(`🎥 Video is rendering... (${pollCount * 10}s elapsed)`);
      } catch (pollError: any) {
        console.error('Error polling video operation:', pollError);
        
        // Check if polling error is a quota error
        const pollErrorMsg = (pollError?.message || JSON.stringify(pollError) || '').toLowerCase();
        if (pollErrorMsg.includes('quota') || pollErrorMsg.includes('429') || pollErrorMsg.includes('resource_exhausted')) {
          const quotaError = new Error("QUOTA_EXCEEDED");
          (quotaError as any).isQuotaError = true;
          (quotaError as any).originalError = pollError;
          throw quotaError;
        }
        
        throw new Error(`Failed to check video generation status: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
      }
    }

    // Check if operation completed with an error
    if ((operation as any)?.error) {
      const opError = (operation as any).error;
      const opErrorMsg = (opError?.message || JSON.stringify(opError) || '').toLowerCase();
      if (opErrorMsg.includes('quota') || opErrorMsg.includes('429') || opErrorMsg.includes('resource_exhausted')) {
        const quotaError = new Error("QUOTA_EXCEEDED");
        (quotaError as any).isQuotaError = true;
        (quotaError as any).originalError = opError;
        throw quotaError;
      }
      throw new Error(opError?.message || 'Video generation failed');
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      // Check if there's an error in the response
      if ((operation.response as any)?.error) {
        const respError = (operation.response as any).error;
        const respErrorMsg = (respError?.message || JSON.stringify(respError) || '').toLowerCase();
        if (respErrorMsg.includes('quota') || respErrorMsg.includes('429') || respErrorMsg.includes('resource_exhausted')) {
          const quotaError = new Error("QUOTA_EXCEEDED");
          (quotaError as any).isQuotaError = true;
          (quotaError as any).originalError = respError;
          throw quotaError;
        }
      }
      throw new Error(`Video generation failed - no video URI in response`);
    }

    // Construct video URL with API key for authentication
    // Check if URL already has query parameters
    const separator = downloadLink.includes('?') ? '&' : '?';
    const videoUrl = `${downloadLink}${separator}key=${apiKey}`;
    
    console.log('Generated video URL:', videoUrl);
    onProgress?.('✨ Your video is ready!');
    return [videoUrl];

  } catch (e) {
    // Log the full error for debugging
    console.error(`Error generating video for "${recipe.title}":`, e);
    
    let errorBody: any = {};
    let errorMessage = 'Unknown error';
    let errorStatus = '';
    
    if (e instanceof Error) {
      errorMessage = e.message;
      try {
        // Try to parse if it's JSON
        errorBody = JSON.parse(e.message);
        errorStatus = errorBody?.error?.status || '';
        errorMessage = errorBody?.error?.message || e.message;
      } catch (parseError) {
        // Not JSON, use the message directly
        errorBody = { error: { message: e.message, status: '' } };
      }
    } else if (typeof e === 'object' && e !== null) {
      errorBody = e;
      errorStatus = (e as any)?.error?.status || (e as any)?.status || '';
      errorMessage = (e as any)?.error?.message || (e as any)?.message || JSON.stringify(e);
    } else {
      errorMessage = String(e);
    }

    const status = (errorStatus || '').toLowerCase();
    const message = (errorMessage || '').toLowerCase();
    
    // Log detailed error info for debugging
    console.error('Error status:', status);
    console.error('Error message:', errorMessage);
    console.error('Full error object:', JSON.stringify(errorBody, null, 2));

    // Handle 404 Not Found - Invalid API key or no Veo access
    if (status.includes("not_found") || message.includes("not found") || message.includes("404")) {
      throw new Error("Your API key is invalid or lacks Veo access. Please select a valid key and try again. For more info on billing, visit ai.google.dev/gemini-api/docs/billing.");
    }
    
    // Handle 429 Resource Exhausted - Quota exceeded
    // DON'T retry on quota errors - they won't resolve quickly
    if (status.includes("resource_exhausted") || message.includes("quota") || message.includes("429") || 
        message.includes("quota exceeded") || message.includes("rate limit")) {
      // Create a special error that can be caught and handled gracefully
      const quotaError = new Error("QUOTA_EXCEEDED");
      (quotaError as any).isQuotaError = true;
      (quotaError as any).userMessage = "Video generation quota exceeded. Recipes are still available without videos. Check your Google Cloud billing and quota limits.";
      throw quotaError;
    }
    
    // Handle permission denied / leaked API key
    if (status.includes("permission_denied") || message.includes("permission denied") || message.includes("403") || message.includes("leaked")) {
      throw new Error("Your API key was reported as leaked or doesn't have permission. Please get a new API key from https://ai.google.dev/ and update your .env.local file.");
    }
    
    // Retry on transient errors (up to 2 times)
    if (retryCount < 2 && (status.includes("unavailable") || status.includes("deadline_exceeded") || message.includes("timeout"))) {
      const delay = Math.pow(2, retryCount) * 1000;
      onProgress?.(`⏳ Retrying after ${delay/1000}s... (attempt ${retryCount + 1}/2)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateRecipeVideos(storyboard, recipe, onProgress, retryCount + 1);
    }
    
    // Provide more detailed error message if available
    const userFriendlyMessage = errorMessage.length > 200 
      ? `An unexpected error occurred: ${errorMessage.substring(0, 200)}...` 
      : `An unexpected error occurred: ${errorMessage}`;
    
    throw new Error(userFriendlyMessage + " Please try again. If the issue persists, check your API key and Veo access.");
  }
};

// Generate videos for all recipes
export const generateAllRecipeVideos = async (
  recipes: Recipe[],
  onProgress?: (message: string, currentRecipe: number, totalRecipes: number) => void
): Promise<{ 
  recipeVideos: { [recipeIndex: number]: string[] };
  recipeStoryboards: { [recipeIndex: number]: Storyboard };
  quotaExceeded: boolean;
}> => {
  const apiKey = await ensureApiKey();
  const recipeVideos: { [recipeIndex: number]: string[] } = {};
  const recipeStoryboards: { [recipeIndex: number]: Storyboard } = {};
  let quotaExceeded = false;
  
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    
    // If quota was exceeded in a previous attempt, skip remaining videos
    if (quotaExceeded) {
      onProgress?.(`⏸️ Skipping video generation (quota exceeded): ${recipe.title}`, i + 1, recipes.length);
      recipeVideos[i] = [];
      continue;
    }
    
    try {
      onProgress?.(`Generating video for: ${recipe.title}`, i + 1, recipes.length);
      
      // Generate storyboard for this recipe (skip if quota exceeded)
      if (!quotaExceeded) {
        try {
          const storyboard = await generateRecipeStoryboard(recipe, apiKey);
          recipeStoryboards[i] = storyboard;
        } catch (storyboardError) {
          console.warn(`Failed to generate storyboard for recipe ${i + 1}:`, storyboardError);
          // Continue without storyboard
        }
      }
      
      // Generate video with progress updates
      if (!quotaExceeded && recipeStoryboards[i]) {
        try {
          const videoUrls = await generateRecipeVideos(
            recipeStoryboards[i],
            recipe,
            (msg) => {
              // Ensure message is always a string
              const progressMsg = typeof msg === 'string' ? msg : String(msg || 'Processing...');
              onProgress?.(progressMsg, i + 1, recipes.length);
            }
          );
          
          recipeVideos[i] = videoUrls;
          onProgress?.(`✅ Video generated for ${recipe.title}`, i + 1, recipes.length);
          
          // Small delay between videos to avoid rate limits (longer delay for quota protection)
          if (i < recipes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Increased to 3s
          }
        } catch (videoError: any) {
          // Check if it's a quota error
          if (videoError?.isQuotaError || 
              (videoError instanceof Error && (
                videoError.message.includes("QUOTA_EXCEEDED") ||
                videoError.message.includes("quota") ||
                videoError.message.includes("429") ||
                videoError.message.includes("resource_exhausted")
              ))) {
            console.warn(`Quota exceeded while generating video for recipe ${i + 1} (${recipe.title})`);
            quotaExceeded = true;
            onProgress?.(`⚠️ Quota limit reached. Skipping remaining videos.`, i + 1, recipes.length);
            recipeVideos[i] = [];
            
            // Skip remaining videos
            for (let j = i + 1; j < recipes.length; j++) {
              recipeVideos[j] = [];
            }
            break; // Exit the loop
          } else {
            // Other errors - log but continue
            console.warn(`Failed to generate video for recipe ${i + 1} (${recipe.title}):`, videoError);
            recipeVideos[i] = [];
          }
        }
      } else {
        recipeVideos[i] = [];
      }
    } catch (error: any) {
      // Check if it's a quota error
      if (error?.isQuotaError || 
          (error instanceof Error && (
            error.message.includes("QUOTA_EXCEEDED") ||
            error.message.includes("quota") ||
            error.message.includes("429")
          ))) {
        console.warn(`Quota exceeded for recipe ${i + 1}`);
        quotaExceeded = true;
        onProgress?.(`⚠️ Quota limit reached. Skipping remaining videos.`, i + 1, recipes.length);
        recipeVideos[i] = [];
        
        // Skip remaining videos
        for (let j = i + 1; j < recipes.length; j++) {
          recipeVideos[j] = [];
        }
        break;
      } else {
        console.warn(`Failed to generate video for recipe ${i + 1} (${recipe.title}):`, error);
        recipeVideos[i] = [];
      }
    }
  }
  
  return { recipeVideos, recipeStoryboards, quotaExceeded };
};