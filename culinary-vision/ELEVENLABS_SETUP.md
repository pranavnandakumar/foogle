# Eleven Labs Voice Integration Setup

This guide will help you set up Eleven Labs voice integration for recipe voiceovers and the AI assistant's chef voice.

## Features

- 🎤 **Recipe Voiceovers**: Each recipe card automatically generates and plays a voiceover narration based on the storyboard script
- 👨‍🍳 **Chef Voice for AI Assistant**: The Cooking Assistant Agent speaks with a friendly chef voice
- 🔊 **Audio Controls**: Play/pause and mute controls for both recipe voiceovers and assistant voice
- ⚡ **Auto-play**: Voiceovers automatically play when recipe cards are visible (if not muted)

## Setup Instructions

### 1. Get Your Eleven Labs API Key

1. Visit [Eleven Labs](https://elevenlabs.io/)
2. Sign up or log in to your account
3. Navigate to your profile → API Keys
4. Create a new API key or copy an existing one
5. **Important**: Save the key securely - it will only be shown once!

### 2. Add API Key to Environment Variables

Create a `.env.local` file in the `culinary-vision` directory (if it doesn't exist) and add:

```bash
ELEVENLABS_API_KEY=your_api_key_here
```

**Note**: Make sure `.env.local` is in your `.gitignore` file to keep your API key secure.

### 3. Restart Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Voice Configuration

### Recipe Voiceovers

- **Voice**: Adam (warm, friendly, clear)
- **Model**: `eleven_multilingual_v2` (supports multiple languages)
- **Settings**:
  - Stability: 0.6 (balanced expressiveness)
  - Similarity Boost: 0.8 (high voice quality)
  - Style: 0.2 (slightly expressive)
  - Speaker Boost: Enabled

### Chef Voice (AI Assistant)

- **Voice**: Adam (warm, friendly, professional)
- **Model**: `eleven_multilingual_v2`
- **Settings**:
  - Stability: 0.7 (consistent chef persona)
  - Similarity Boost: 0.8 (high voice quality)
  - Style: 0.3 (expressive, friendly)
  - Speaker Boost: Enabled

### Changing Voices

You can change the voice IDs in `services/elevenLabsService.ts`:

```typescript
// Recipe narration voice
const RECIPE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam

// Chef voice for AI assistant
const CHEF_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam
```

Popular voice options:
- `pNInz6obpgDQGcFmaJgB` - Adam (warm, friendly)
- `EXAVITQu4vr4xnSDxMaL` - Bella (clear, friendly)
- `VR6AewLTigWG4xSOukaG` - Arnold (deep, authoritative)
- `TxGEqnHWrfWFTfGW9XjX` - Josh (energetic, enthusiastic)

Browse more voices at [Eleven Labs Voice Library](https://elevenlabs.io/voice-library)

## Usage

### Recipe Voiceovers

1. When you upload an image and generate recipes, voiceovers are automatically generated
2. Each recipe card shows voice controls (play/pause and mute buttons) in the top-right corner
3. Voiceovers auto-play when a recipe card becomes visible (if not muted)
4. You can control playback using the on-screen controls

### AI Assistant Chef Voice

1. Open the AI Assistant by clicking the "AI Assistant" button on any recipe card
2. The chef voice is enabled by default
3. When the assistant responds, the voice is automatically generated and played
4. Use the volume button in the header to enable/disable voice
5. Use the play/pause button to control playback of the current response

## Troubleshooting

### "Eleven Labs API key is not configured" Error

- Make sure you've created a `.env.local` file in the `culinary-vision` directory
- Verify the key is set as `ELEVENLABS_API_KEY=your_key_here`
- Restart your development server after adding the key
- Check that the key doesn't have extra spaces or quotes

### Voice Not Playing

- Check browser console for errors
- Verify your API key is valid and has credits
- Check browser autoplay policies (some browsers block autoplay)
- Try clicking the play button manually

### Voice Quality Issues

- Adjust voice settings in `services/elevenLabsService.ts`
- Try different voice IDs
- Check your internet connection (voice generation requires API calls)

### API Quota/Usage

- Monitor your usage at [Eleven Labs Dashboard](https://elevenlabs.io/app/usage)
- Each recipe voiceover uses credits
- Each AI assistant response uses credits
- Consider using Test Mode to save credits during development

## Cost Estimation

- **Recipe Voiceovers**: ~1-2 credits per recipe (depending on script length)
- **AI Assistant Voice**: ~1-3 credits per response (depending on response length)
- **Free Tier**: 10,000 characters per month
- **Paid Plans**: Starting at $5/month for 30,000 characters

## Creative Features

### Custom Voice Settings

You can customize voice settings per use case in `services/elevenLabsService.ts`:

```typescript
export const generateRecipeVoiceover = async (
  voiceoverScript: string,
  voiceId?: string
): Promise<string> => {
  return generateSpeechUrl(voiceoverScript, {
    voiceId: voiceId || RECIPE_VOICE_ID,
    stability: 0.6,      // 0.0-1.0 (higher = more consistent)
    similarityBoost: 0.8, // 0.0-1.0 (higher = more like original)
    style: 0.2,          // 0.0-1.0 (higher = more expressive)
    useSpeakerBoost: true
  });
};
```

### Multiple Voices

You can use different voices for different recipes or contexts:

```typescript
// Use different voice for dessert recipes
if (recipe.title.toLowerCase().includes('dessert')) {
  voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella - sweeter voice
}
```

## Security Notes

- ⚠️ **Never commit your API key to version control**
- ✅ Always use `.env.local` (which should be in `.gitignore`)
- ✅ Rotate your API keys periodically
- ✅ Monitor your usage to prevent unexpected charges
- ✅ Use environment variables, never hardcode keys

## Support

For issues or questions:
- Check the [Eleven Labs Documentation](https://elevenlabs.io/docs)
- Review the browser console for error messages
- Verify your API key and credits in the Eleven Labs dashboard

