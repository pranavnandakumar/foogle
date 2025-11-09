// Eleven Labs Voice Service
// Provides text-to-speech capabilities for recipes and AI assistant

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs - You can find more at https://elevenlabs.io/voice-library
// Chef voice - warm, friendly, professional cooking voice
const CHEF_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam - warm, friendly (good for chef)
// Alternative chef voices (uncomment to try):
// const CHEF_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella - clear, friendly
// const CHEF_VOICE_ID = 'VR6AewLTigWG4xSOukaG'; // Arnold - deep, authoritative
// const CHEF_VOICE_ID = 'TxGEqnHWrfWFTfGW9XjX'; // Josh - energetic, enthusiastic

// Recipe narration voice - clear, engaging
const RECIPE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam - clear and engaging

interface VoiceGenerationOptions {
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

const ensureApiKey = (): string => {
  // Check process.env (defined in vite.config.ts) first, then import.meta.env as fallback
  const apiKey = (typeof process !== 'undefined' && process.env?.ELEVENLABS_API_KEY) ||
                 (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELEVENLABS_API_KEY);
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error(
      "Eleven Labs API key is not configured. " +
      "Please set ELEVENLABS_API_KEY in your .env.local file. " +
      "Get your API key from https://elevenlabs.io/"
    );
  }
  return apiKey;
};

/**
 * Generate speech from text using Eleven Labs
 */
export const generateSpeech = async (
  text: string,
  options: VoiceGenerationOptions = {}
): Promise<ArrayBuffer> => {
  const apiKey = ensureApiKey();
  const voiceId = options.voiceId || RECIPE_VOICE_ID;
  
  const requestBody = {
    text: text,
    model_id: options.model || "eleven_multilingual_v2",
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarityBoost ?? 0.75,
      style: options.style ?? 0.0,
      use_speaker_boost: options.useSpeakerBoost ?? true
    }
  };

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eleven Labs API error:', errorText);
      throw new Error(`Eleven Labs API error: ${response.status} - ${errorText}`);
    }

    const audioData = await response.arrayBuffer();
    return audioData;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

/**
 * Generate speech and return as a Blob URL for audio playback
 */
export const generateSpeechUrl = async (
  text: string,
  options: VoiceGenerationOptions = {}
): Promise<string> => {
  try {
    const audioData = await generateSpeech(text, options);
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating speech URL:', error);
    throw error;
  }
};

/**
 * Generate recipe voiceover from storyboard
 */
export const generateRecipeVoiceover = async (
  voiceoverScript: string,
  voiceId?: string
): Promise<string> => {
  return generateSpeechUrl(voiceoverScript, {
    voiceId: voiceId || RECIPE_VOICE_ID,
    stability: 0.6,
    similarityBoost: 0.8,
    style: 0.2, // Slight style for more expressive delivery
    useSpeakerBoost: true
  });
};

/**
 * Generate chef voice for AI assistant
 */
export const generateChefVoice = async (
  text: string
): Promise<string> => {
  return generateSpeechUrl(text, {
    voiceId: CHEF_VOICE_ID,
    stability: 0.7, // Higher stability for consistent chef voice
    similarityBoost: 0.8,
    style: 0.3, // More expressive for friendly chef persona
    useSpeakerBoost: true
  });
};

/**
 * Generate step-by-step recipe narration
 */
export const generateRecipeStepsNarration = async (
  recipeTitle: string,
  steps: string[],
  voiceId?: string
): Promise<string> => {
  const narrationText = `Let's make ${recipeTitle}. ${steps.map((step, index) => `Step ${index + 1}: ${step}`).join('. ')}. Enjoy your ${recipeTitle}!`;
  
  return generateSpeechUrl(narrationText, {
    voiceId: voiceId || RECIPE_VOICE_ID,
    stability: 0.6,
    similarityBoost: 0.8,
    style: 0.2,
    useSpeakerBoost: true
  });
};

/**
 * Get available voices (for future voice selection feature)
 */
export const getAvailableVoices = async (): Promise<any[]> => {
  const apiKey = ensureApiKey();
  
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
};

