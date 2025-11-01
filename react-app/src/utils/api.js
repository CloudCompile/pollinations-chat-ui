// API utilities for Pollinations chat
const MODELS = {
  'openai': 'openai',
  'mistral': 'mistral',
  'claude-3.5-sonnet': 'claude-3.5-sonnet',
  'gemini-pro': 'gemini-pro',
  'llama-3.1-70b': 'llama-3.1-70b',
  'grok-beta': 'grok-beta'
};

// API endpoints
const API_ENDPOINTS = {
  textModels: 'https://text.pollinations.ai/models',
  imageModels: 'https://image.pollinations.ai/models'
};

let abortController = null;

// Function to check if a model supports vision
const modelSupportsVision = (model) => {
  // In a real implementation, this would check against actual model capabilities
  // For now, we'll assume certain models support vision
  const visionModels = ['gpt-4-vision', 'claude-3-opus', 'claude-3-sonnet', 'gemini-pro-vision'];
  return visionModels.includes(model);
};

// Load available models from API endpoints
export const loadModels = async () => {
  try {
    const [textResponse, imageResponse] = await Promise.allSettled([
      fetch(API_ENDPOINTS.textModels),
      fetch(API_ENDPOINTS.imageModels)
    ]);

    let textModels = [];
    let imageModels = [];

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
    }

    return { textModels, imageModels };
  } catch (error) {
    console.error('❌ Error loading models:', error);
    return { textModels: [], imageModels: [] };
  }
};

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

export const sendMessage = async (messages, onChunk, onComplete, onError) => {
  const model = localStorage.getItem('selectedModel') || 'openai';
  
  try {
    abortController = new AbortController();
    
    // Check if we have images and model supports vision
    const hasImages = messages.some(msg => 
      msg.content && typeof msg.content === 'object' && msg.content.image
    );
    const supportsVision = modelSupportsVision(model);
    
    if (hasImages && supportsVision) {
      // Handle vision model request
      const formattedMessages = formatMessagesForAPI(messages);
      const latestImage = getLatestImage(messages);
      
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: formattedMessages,
          model,
          stream: false,
          image: latestImage || undefined
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const assistantMessage = result?.choices?.[0]?.message?.content || '';
      
      if (assistantMessage) {
        if (onChunk) onChunk(assistantMessage, assistantMessage);
        if (onComplete) onComplete(assistantMessage);
      } else {
        throw new Error('No content returned from vision model');
      }
    } else {
      // Standard text-only streaming
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          stream: true
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete(fullContent);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        onChunk(chunk, fullContent);
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      onError(new Error('User aborted'));
    } else {
      onError(error);
    }
  }
};

export const stopGeneration = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
};

export const formatMessagesForAPI = (messages) => {
  return messages.map(msg => {
    // If message has an image, format accordingly for vision models
    if (msg.content && typeof msg.content === 'object' && msg.content.image) {
      return {
        role: msg.role,
        content: [
          {
            type: 'image_url',
            image_url: {
              url: msg.content.image  // base64 data URL
            }
          },
          ...(msg.content.text ? [{
            type: 'text',
            text: msg.content.text
          }] : [])
        ]
      };
    }
    
    // Standard text message
    return {
      role: msg.role,
      content: typeof msg.content === 'object' ? msg.content.text || '' : msg.content
    };
  });
};

// Get the most recent user image attachment
const getLatestImage = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user' && msg.content && typeof msg.content === 'object' && msg.content.image) {
      return msg.content.image;
    }
  }
  return null;
};

export { MODELS };
