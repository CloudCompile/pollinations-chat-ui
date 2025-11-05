// API utilities for Pollinations chat - Enhanced version from vanilla
const BASE_TEXT_URL = 'https://enter.pollinations.ai/api/generate/v1';
const BASE_IMAGE_URL = 'https://enter.pollinations.ai/api/generate/image';
const TEXT_MODELS_ENDPOINT = 'https://enter.pollinations.ai/api/generate/v1/models';
const IMAGE_MODELS_ENDPOINT = 'https://enter.pollinations.ai/api/generate/image/models';
const API_TOKEN = 'plln_pk_ZRwbgnIichFj5uKd1ImgJeBXj25knEMBc2UfIJehx9p7veEGiTH3sIxGlbZOfiee';

let textModels = [];
let imageModels = [];
let abortController = null;

// Format model names
const formatModelName = (modelId) => {
  if (typeof modelId !== 'string') return 'Unknown Model';
  return modelId
    .split('/')
    .pop()
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Load available models from API
export const loadModels = async () => {
  try {
    const [textResponse, imageResponse] = await Promise.allSettled([
      fetch(TEXT_MODELS_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }),
      fetch(IMAGE_MODELS_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      })
    ]);

    if (textResponse.status === 'fulfilled' && textResponse.value.ok) {
      const textData = await textResponse.value.json();
      // Handle both array format and OpenAI format with data array
      const modelsArray = Array.isArray(textData) ? textData : textData.data;
      if (Array.isArray(modelsArray)) {
        textModels = modelsArray.map(model => ({
          id: model.id || model.name || model,
          name: formatModelName(model.id || model.name || model),
          type: 'text',
          ownedBy: model.owned_by || 'unknown',
          created: model.created,
          supportsVision: model.vision === true,
          supportsAudio: model.audio === true,
          inputModalities: model.input_modalities || ['text'],
          outputModalities: model.output_modalities || ['text'],
          tier: model.tier || 'unknown',
          community: model.community || false
        }));
        console.log(`✅ Loaded ${textModels.length} text models from API`);
      }
    } else {
      console.error('❌ Failed to load text models from endpoint');
      textModels = [];
    }

    if (imageResponse.status === 'fulfilled' && imageResponse.value.ok) {
      const imageData = await imageResponse.value.json();
      if (Array.isArray(imageData)) {
        imageModels = imageData.map(model => ({
          id: model.name || model.id || model,
          name: model.description || formatModelName(model.name || model.id || model),
          type: 'image',
          tier: model.tier || 'unknown'
        }));
        console.log(`✅ Loaded ${imageModels.length} image models from API`);
      }
    } else {
      console.error('❌ Failed to load image models from endpoint');
      imageModels = [];
    }

    return { textModels, imageModels };
  } catch (error) {
    console.error('❌ Error loading models:', error);
    return { textModels: [], imageModels: [] };
  }
};

// Get all models
export const getModels = () => {
  return { textModels, imageModels };
};

// Build MODELS object from loaded models
export const MODELS = {};

// Initialize models (will be called from App.jsx)
export const initializeModels = async () => {
  const { textModels: loadedTextModels } = await loadModels();
  
  // Populate MODELS object
  loadedTextModels.forEach(model => {
    MODELS[model.id] = { name: model.name, ...model };
  });
  
  // Add fallback models if none loaded
  if (Object.keys(MODELS).length === 0) {
    MODELS['openai'] = { name: 'OpenAI GPT', id: 'openai' };
    MODELS['mistral'] = { name: 'Mistral', id: 'mistral' };
    MODELS['claude-3.5-sonnet'] = { name: 'Claude 3.5 Sonnet', id: 'claude-3.5-sonnet' };
  }
  
  return MODELS;
};

// Get current model info
const getCurrentModelInfo = (modelId) => {
  const allModels = [...textModels, ...imageModels];
  return allModels.find(m => m.id === modelId);
};

// Get latest image from messages
const getLatestImage = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user' && msg.image && msg.image.src) {
      return msg.image.src;
    }
  }
  return null;
};

// Format messages for API (with vision support)
export const formatMessagesForAPI = (messages, modelId) => {
  const currentModel = getCurrentModelInfo(modelId);
  const supportsVision = currentModel && currentModel.supportsVision;

  return messages.map(msg => {
    // If message has an image and model supports vision, format accordingly
    if (msg.image && msg.image.src && supportsVision) {
      return {
        role: msg.role,
        content: [
          {
            type: 'image_url',
            image_url: {
              url: msg.image.src  // base64 data URL
            }
          },
          ...(msg.content ? [{
            type: 'text',
            text: msg.content
          }] : [])
        ]
      };
    }
    
    // Standard text message
    return {
      role: msg.role,
      content: msg.content
    };
  });
};

export const sendMessage = async (messages, onChunk, onComplete, onError) => {
  const modelId = localStorage.getItem('selectedModel') || 'openai';
  
  try {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const currentModel = getCurrentModelInfo(modelId);
    const hasImages = messages.some(m => m.image && m.image.src);
    const supportsVision = currentModel && currentModel.supportsVision;
    const latestImage = getLatestImage(messages);
    const formattedMessages = formatMessagesForAPI(messages, modelId);

    // Generate random seed to prevent caching
    const seed = Math.floor(Math.random() * 2147483647);

    // Use OpenAI-compatible endpoint
    const url = `${BASE_TEXT_URL}/chat/completions`;

    console.log(`🚀 Sending streaming request to ${modelId} with seed ${seed}`);

    const requestBody = {
      messages: formattedMessages,
      model: modelId,
      stream: true,
      seed: seed
    };

    // Add image if present and model supports vision
    if (hasImages && supportsVision && latestImage) {
      requestBody.image = latestImage;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let chunkCount = 0;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Final update with complete content
        console.log(`✅ Streaming complete. Total chunks: ${chunkCount}, Length: ${fullContent.length}`);
        if (onComplete) onComplete(fullContent);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) continue;
        
        // Parse SSE format (data: {...})
        if (trimmedLine.startsWith('data:')) {
          const jsonStr = trimmedLine.slice(5).trim();
          
          // Skip [DONE] message
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content || '';
            
            if (content) {
              chunkCount++;
              fullContent += content;
              // Update immediately for each chunk
              if (onChunk) onChunk(content, fullContent);
            }
          } catch (e) {
            console.warn('Failed to parse SSE chunk:', jsonStr);
          }
        }
      }
    }

    abortController = null;
    return fullContent;
  } catch (error) {
    abortController = null;
    if (error.name === 'AbortError') {
      console.log('⛔ Generation aborted');
      if (onError) onError(new Error('User aborted'));
      return null;
    }
    console.error('Streaming request error:', error);
    if (onError) onError(error);
    throw error;
  }
};

export const stopGeneration = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
    console.log('🛑 Generation stopped');
  }
};
// Generate image from text prompt
export const generateImage = async (prompt, options = {}) => {
  try {
    const {
      model = 'flux',
      width = 1024,
      height = 1024,
      seed = Math.floor(Math.random() * 2147483647),
      nologo = false,
      enhance = false,
      nofeed = false,
      safe = false,
      quality = 'medium'
    } = options;

    // Build URL with prompt in path and parameters as query string
    const params = new URLSearchParams({
      model,
      width: width.toString(),
      height: height.toString(),
      seed: seed.toString(),
      enhance: enhance.toString(),
      nologo: nologo.toString(),
      nofeed: nofeed.toString(),
      safe: safe.toString(),
      quality
    });

    // Encode the prompt for URL path
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${BASE_IMAGE_URL}/${encodedPrompt}?${params.toString()}`;
    
    console.log(`🎨 Generating image with prompt: "${prompt}"`);
    console.log(`📐 Parameters: ${width}x${height}, model: ${model}, seed: ${seed}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
    }

    // Get the image as a blob
    const blob = await response.blob();
    
    // Convert blob to base64 data URL for display
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(`✅ Image generated successfully`);
        resolve({
          url: reader.result,
          prompt,
          model,
          width,
          height,
          seed
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Image generation error:', error);
    throw error;
  }
};

// Get available image models
export const getImageModels = () => {
  return imageModels.length > 0 ? imageModels : [
    { id: 'flux', name: 'Flux', type: 'image' },
    { id: 'flux-realism', name: 'Flux Realism', type: 'image' },
    { id: 'flux-anime', name: 'Flux Anime', type: 'image' },
    { id: 'flux-3d', name: 'Flux 3D', type: 'image' },
    { id: 'turbo', name: 'Turbo', type: 'image' }
  ];
};

export { BASE_TEXT_URL, BASE_IMAGE_URL };


