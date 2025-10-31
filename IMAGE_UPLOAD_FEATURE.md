# Image Upload Feature for Vanilla Chat UI

## ✅ Implemented Features

### 1. **Dynamic Model Loading from API**
- ✅ Removed all hardcoded models
- ✅ Always fetches models from `https://text.pollinations.ai/models`
- ✅ Extracts vision support info from API (`model.vision` field)
- ✅ Shows vision icon (👁️) for models that support image input
- ✅ Loads model metadata: `supportsVision`, `supportsAudio`, `inputModalities`, `tier`, etc.

### 2. **Image Upload UI**
- ✅ Hidden file input (`#imageFileInput`) accepts images only
- ✅ "Upload File" button in attach menu triggers file picker
- ✅ Image converted to base64 data URL on selection
- ✅ Added image data to message object with metadata (filename, size)

### 3. **Image Message Rendering**
- ✅ Messages with images display image thumbnail
- ✅ Images styled with rounded corners, shadows, hover effects
- ✅ Max dimensions: 400x400px, responsive
- ✅ Optional caption/filename display
- ✅ Images stored in localStorage as base64

### 4. **Vision API Integration**
- ✅ Detects if current model supports vision
- ✅ Formats messages with images using OpenAI vision format:
  ```json
  {
    "role": "user",
    "content": [
      { "type": "image_url", "image_url": { "url": "data:image/..." } },
      { "type": "text", "text": "caption or question" }
    ]
  }
  ```
- ✅ Sends vision requests via POST with JSON body to Pollinations API
- ✅ Falls back to standard text streaming for non-vision models

### 5. **CSS Styling**
- ✅ `.message-image-wrap` - container for images
- ✅ `.message-image` - responsive image with hover scale effect
- ✅ `.message-image-caption` - optional caption styling

## 🔧 Files Modified

1. **`index.html`** - Added hidden file input
2. **`js/app.js`** - File upload trigger and base64 conversion
3. **`js/chat.js`** - Message rendering with image support
4. **`js/api.js`** - Vision model detection and API integration
5. **`styles/chat.css`** - Image message styling

## 🎯 Vision-Capable Models (from API)

Models that support image input (as of API response):
- ✅ **gemini** - Gemini 2.5 Flash Lite
- ✅ **gemini-search** - Gemini with Google Search
- ✅ **openai** - OpenAI GPT-5 Nano
- ✅ **openai-audio** - GPT-4o Mini Audio
- ✅ **openai-fast** - GPT-4.1 Nano
- ✅ **openai-large** - GPT-4.1
- ✅ **openai-reasoning** - o4 Mini
- ✅ **bidara** - NASA BIDARA
- ✅ **evil** - Evil (community)
- ✅ **unity** - Unity Unrestricted Agent

## 📝 Usage Instructions

1. Open the chat UI
2. Click the **+** (attach) button
3. Select **"Upload File"**
4. Choose an image from your device
5. The image appears as a message bubble
6. **Switch to a vision-capable model** (look for 👁️ icon)
7. Type a question about the image
8. The AI will analyze the image and respond

## ⚠️ Important Notes

- Images are sent to the API only if the current model supports vision
- Non-vision models will ignore image messages
- Images are stored as base64 in localStorage (may increase storage usage)
- Large images are displayed at max 400x400px but full resolution is sent to API
