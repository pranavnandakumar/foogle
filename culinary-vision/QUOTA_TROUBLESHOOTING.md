# Quota Troubleshooting Guide

## Problem: Video Generation Quota Exceeded

If you're seeing quota errors when trying to generate videos, this guide will help you understand and resolve the issue.

## Understanding Veo 3 Quota Limits

Google's Veo 3 video generation API has strict quota limits:
- **Daily limits**: Usually very low for free tier (often 1-5 videos per day)
- **Rate limits**: Limited number of requests per minute/hour
- **Billing**: Requires active billing account with sufficient credits

## What Happens When Quota is Exceeded

The app now handles quota errors gracefully:
1. **Early Detection**: If quota is hit on the first video, remaining videos are skipped
2. **No Retries**: Quota errors don't resolve quickly, so we don't waste time retrying
3. **Graceful Fallback**: Recipes are still available without videos
4. **Visual Feedback**: You'll see a warning message when quota is exceeded

## Solutions

### 1. Check Your Google Cloud Quotas

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Quotas**
3. Search for "Veo" or "Generative Language API"
4. Check your current usage and limits
5. Look for any quota increase requests

### 2. Enable Billing

Veo 3 requires an active billing account:
1. Go to [Google Cloud Billing](https://console.cloud.google.com/billing)
2. Ensure billing is enabled
3. Check you have sufficient credits/quota

### 3. Request Quota Increase

If you need more quota:
1. Go to [Google Cloud Console Quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
2. Select the Veo 3 quota
3. Click "Edit Quotas"
4. Request an increase (may require justification)

### 4. Use the App Without Videos

The app works perfectly without videos:
- All recipes are still generated
- Recipe details, steps, and instructions are available
- AI Assistant still works (shopping lists, substitutions, meal planning)
- Beautiful gradient backgrounds replace videos

### 5. Wait and Retry

Quota limits often reset:
- **Daily quotas**: Reset at midnight (your timezone)
- **Hourly quotas**: Reset every hour
- Wait for the reset period and try again

## How the App Handles Quota Errors

### Before (Old Behavior)
- ❌ Retried multiple times (wasting API calls)
- ❌ Continued trying all recipes even after quota hit
- ❌ Showed confusing error messages

### Now (New Behavior)
- ✅ Detects quota errors immediately
- ✅ Stops trying remaining videos after first quota error
- ✅ Shows clear warning messages
- ✅ Continues with recipes (no videos, but fully functional)
- ✅ Visual indicators when quota is exceeded

## Troubleshooting Steps

1. **Check API Key**
   - Verify your API key is valid
   - Ensure it has Veo access enabled
   - Check it's not leaked/revoked

2. **Check Billing**
   - Verify billing is enabled
   - Check for sufficient credits
   - Look for any billing issues

3. **Check Quota Status**
   - View current quota usage
   - Check when quotas reset
   - Look for any quota increase requests

4. **Use Without Videos**
   - The app works great without videos
   - All features except videos are available
   - Try again later when quota resets

## Common Error Messages

### "Quota exceeded" / "429" / "resource_exhausted"
- **Meaning**: You've hit your quota limit
- **Solution**: Wait for quota reset or request increase
- **Workaround**: Use app without videos (still fully functional)

### "API key invalid" / "404"
- **Meaning**: API key issue or no Veo access
- **Solution**: Get new API key with Veo access
- **Check**: Verify key in Google Cloud Console

### "Permission denied" / "403"
- **Meaning**: API key revoked or leaked
- **Solution**: Generate new API key
- **Security**: Never commit API keys to git

## Best Practices

1. **Monitor Quota Usage**: Check your usage regularly
2. **Use Videos Sparingly**: Only generate when necessary
3. **Batch Requests**: Generate videos during off-peak hours
4. **Have Backup Plan**: App works without videos
5. **Request Increases**: If you need more quota, request it early

## Getting Help

If you continue to have issues:
1. Check [Google Cloud Status](https://status.cloud.google.com/)
2. Review [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
3. Check [Veo 3 Documentation](https://ai.google.dev/gemini-api/docs/veo)
4. Contact Google Cloud Support for quota issues

## Summary

- ✅ Quota errors are handled gracefully
- ✅ App continues to work without videos
- ✅ Clear visual feedback when quota is exceeded
- ✅ No wasted API calls on quota errors
- ✅ Recipes and AI Assistant still fully functional

The app is designed to work well even when video generation isn't available. Enjoy your recipes! 🍳

