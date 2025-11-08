import { GoogleGenAI, Type } from '@google/genai';
import type { CulinaryPlan } from '../types';

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
        voiceover_script: { type: Type.STRING, description: "Natural narration, ~65 words" },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.INTEGER },
              caption: { type: Type.STRING, description: "Very short on-screen text" },
              duration_s: { type: Type.INTEGER, description: "e.g., 3" }
            },
            required: ["step", "caption", "duration_s"]
          }
        }
      },
      required: ["hook", "voiceover_script", "scenes"]
    },
  },
  required: ["ingredients", "recipes", "storyboard"]
};

const ensureApiKey = async (): Promise<string> => {
    // This function ensures an API key is available, prompting the user if necessary.
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
  const apiKey = await ensureApiKey();

  // Always create a fresh instance to ensure the latest key from the dialog is used.
  const ai = new GoogleGenAI({ apiKey });
  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `You are a culinary assistant and short-form recipe video generator.
  
### STEP 1 — INGREDIENTS
Given the uploaded image, identify only edible ingredients. Ignore containers, brands, packaging text, and kitchen items.
Return ingredients as a JSON array of lowercase singular ingredient names.

### STEP 2 — RECIPE OPTIONS
Using only these ingredients plus basic pantry staples (salt, pepper, oil, water), propose 5 recipe ideas.
For each recipe, provide:
- title (fun & catchy, <= 6 words)
- time_minutes (<= 25)
- difficulty: "easy"
- steps: 5–8 short steps, each imperative tense and <= 12 words
- missing_items: at most 0–2 optional extras

### STEP 3 — STORYBOARD GENERATION (FOR THE FIRST RECIPE)
Take the FIRST recipe you listed and generate a short-form vertical video storyboard (total length ~18–30 seconds).
Provide:
- "hook": "One-sentence attention grabber, fun, casual"
- "voiceover_script": "Natural narration, ~65 words, casual like TikTok"
- "scenes": An array of scenes, each with a step number, a very short caption, and a duration.

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
