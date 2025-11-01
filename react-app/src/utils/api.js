// API utilities for Pollinations chat - Enhanced version from vanilla
const BASE_TEXT_URL = 'https://text.pollinations.ai';
const BASE_IMAGE_URL = 'https://image.pollinations.ai';
const TEXT_MODELS_ENDPOINT = 'https://text.pollinations.ai/models';
const IMAGE_MODELS_ENDPOINT = 'https://image.pollinations.ai/models';

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
      fetch(TEXT_MODELS_ENDPOINT),
      fetch(IMAGE_MODELS_ENDPOINT)
    ]);

    if (textResponse.status === 'fulfilled' && textResponse.value.ok) {
      const textData = await textResponse.value.json();
      if (Array.isArray(textData)) {
        textModels = textData.map(model => ({
          id: model.name || model.id || model,
          name: model.description || formatModelName(model.name || model.id || model),
          type: 'text',
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

    let response;

    // If we have images and model supports vision, use POST with JSON
    if (hasImages && supportsVision) {
      const url = `${BASE_TEXT_URL}/openai`;

      console.log(`🚀 Sending vision request with images to ${modelId}`);

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: formattedMessages,
          model: modelId,
          stream: false,
          seed: seed,
          image: latestImage || undefined
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const assistantMessage = result?.choices?.[0]?.message?.content || '';

      if (assistantMessage) {
        if (onChunk) onChunk(assistantMessage, assistantMessage);
        if (onComplete) onComplete(assistantMessage);
      } else {
        throw new Error('No content returned from vision model');
      }

      abortController = null;
      return assistantMessage;
    } else {
      // Standard text-only streaming (GET request)
      const prompt = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n') + '\nAssistant:';
      
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${BASE_TEXT_URL}/${encodedPrompt}?model=${modelId}&seed=${seed}`;

      console.log(`🚀 Sending streaming request with seed ${seed}`);

      response = await fetch(url, {
        method: 'GET',
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log(`✅ Streaming complete. Total chunks: ${chunkCount}, Length: ${fullContent.length}`);
          onComplete(fullContent);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        chunkCount++;
        fullContent += chunk;
        console.log(`📦 Chunk ${chunkCount}: +${chunk.length} chars, total: ${fullContent.length}`);
        if (onChunk) onChunk(chunk, fullContent);
      }

      abortController = null;
      return fullContent;
    }
  } catch (error) {
    abortController = null;
    if (error.name === 'AbortError') {
      console.log('⛔ Generation aborted');
      onError(new Error('User aborted'));
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

export { BASE_TEXT_URL, BASE_IMAGE_URL };

