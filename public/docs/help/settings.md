# Settings Help

## Overview
Configure your Promoty application settings, including AI integration and offline sync preferences.

## AI Configuration

### Setting Up Gemini AI

1. Go to **Settings** → **AI Configuration**
2. Enter your **Gemini API Key**
   - Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy and paste into Promoty

3. Click **Test Connection** to verify
4. Adjust **Temperature** (creativity level):
   - **0.0-0.3**: More focused and deterministic
   - **0.4-0.7**: Balanced creativity (recommended)
   - **0.8-1.0**: More creative and varied

### Using AI Features

Once configured, AI is available for:
- **Social Media**: Content suggestions and hashtags
- **Events**: Description generation
- **Projects**: Task breakdown suggestions

### Troubleshooting AI

**Connection Failed**
- Verify API key is correct
- Check internet connection
- Ensure API key has proper permissions

**Slow Responses**
- Check internet speed
- Try reducing temperature
- Simplify your prompt

## Offline Sync

### How It Works

Promoty automatically syncs data when you're offline:
1. Changes are saved locally in IndexedDB
2. A queue tracks pending changes
3. When online, changes sync automatically
4. You'll see sync status in the sidebar

### Viewing Sync Status

Check the connection indicator in the sidebar:
- **Green**: Online and synced
- **Yellow**: Syncing in progress
- **Red**: Offline (X pending changes)

### Manual Sync

If auto-sync fails:
1. Check connection status
2. Refresh the page
3. Changes will retry automatically

## Data Management

### Clearing Cache

To clear local data:
1. Go to Settings → Data
2. Click **Clear Cache**
3. Confirm action
4. Data will re-download when online

### Export Data

Export your data for backup:
1. Go to Settings → Data
2. Click **Export**
3. Choose format (JSON, CSV)
4. Download file

## Notifications

### Email Notifications

Configure email alerts for:
- Event reminders
- Task deadlines
- Social post schedules

### Push Notifications

Enable browser notifications for:
- Sync completion
- Offline mode alerts
- Important updates

## Tips

- **Secure your API key**: Never share your Gemini API key
- **Test AI first**: Use "Test Connection" before relying on AI features
- **Monitor sync**: Check connection status regularly when offline
- **Backup data**: Periodically export your data
- **Adjust temperature**: Experiment with AI creativity levels
