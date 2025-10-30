// changes: i added a real api call so that this will work

const API = {
  baseTextURL: 'https://text.pollinations.ai',
  baseImageURL: 'https://image.pollinations.ai',
  textModelsEndpoint: 'https://text.pollinations.ai/models',
  imageModelsEndpoint: 'https://image.pollinations.ai/models',
  textModels: [],
  imageModels: [],
  currentModel: 'openai',
  currentModelType: 'text', // 'text' or 'image'
  abortController: null,

  // Initialize API
  async init() {
    console.log('Initializing Pollinations API...');
    await this.loadModels();
  },

  // Load available models
  async loadModels() {
    try {
      const [textResponse, imageResponse] = await Promise.allSettled([
        fetch(this.textModelsEndpoint),
        fetch(this.imageModelsEndpoint)
      ]);

      if (textResponse.status === 'fulfilled' && textResponse.value.ok) {
        const textData = await textResponse.value.json();
        if (Array.isArray(textData)) {
          this.textModels = textData.map(id => ({
            id,
            name: this.formatModelName(id),
            type: 'text'
          }));
        }
      } else this.textModels = this.getDefaultTextModels();

      if (imageResponse.status === 'fulfilled' && imageResponse.value.ok) {
        const imageData = await imageResponse.value.json();
        if (Array.isArray(imageData)) {
          this.imageModels = imageData.map(id => ({
            id,
            name: this.formatModelName(id),
            type: 'image'
          }));
        }
      } else this.imageModels = this.getDefaultImageModels();

      this.updateModelSelector();
    } catch (error) {
      console.error('Error loading models:', error);
      this.textModels = this.getDefaultTextModels();
      this.imageModels = this.getDefaultImageModels();
      this.updateModelSelector();
    }
  },

  // Format model names
  formatModelName(modelId) {
    if (typeof modelId !== 'string') return 'Unknown Model';
    return modelId
      .split('/')
      .pop()
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Default text models
  getDefaultTextModels() {
    return [
      { id: 'openai', name: 'OpenAI', type: 'text' },
      { id: 'mistral', name: 'Mistral', type: 'text' },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', type: 'text' },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', type: 'text' },
      { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', type: 'text' }
    ];
  },

  // Default image models
  getDefaultImageModels() {
    return [
      { id: 'flux', name: 'Flux', type: 'image' },
      { id: 'flux-pro', name: 'Flux Pro', type: 'image' },
      { id: 'flux-realism', name: 'Flux Realism', type: 'image' },
      { id: 'turbo', name: 'Turbo', type: 'image' }
    ];
  },

  // Update model selector in UI
  updateModelSelector() {
    const modelSelector = document.getElementById('modelSelector');
    if (!modelSelector) return;
    modelSelector.innerHTML = '';

    const textGroup = document.createElement('optgroup');
    textGroup.label = '💬 Text Models';
    this.textModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      option.setAttribute('data-type', 'text');
      textGroup.appendChild(option);
    });
    modelSelector.appendChild(textGroup);

    const imageGroup = document.createElement('optgroup');
    imageGroup.label = '🖼️ Image Models';
    this.imageModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      option.setAttribute('data-type', 'image');
      imageGroup.appendChild(option);
    });
    modelSelector.appendChild(imageGroup);

    modelSelector.value = this.currentModel;
  },

  // Set model
  setModel(modelId) {
    this.currentModel = modelId;
    const isText = this.textModels.some(m => m.id === modelId);
    const isImage = this.imageModels.some(m => m.id === modelId);
    this.currentModelType = isImage ? 'image' : 'text';
    console.log(`Model set to: ${modelId} (${this.currentModelType})`);
  },

  // STREAMING MESSAGE HANDLER
  async sendMessage(messages, onChunk, onComplete, onError) {
    try {
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();

      const prompt = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');
      const encodedPrompt = encodeURIComponent(prompt);

      // Choose correct endpoint based on model type
      const baseURL =
        this.currentModelType === 'image'
          ? this.baseImageURL
          : this.baseTextURL;
      const endpoint =
        this.currentModelType === 'image'
          ? `${baseURL}/prompt/${encodedPrompt}`
          : `${baseURL}/openai/${encodedPrompt}`;

      const body = {
        model: this.currentModel,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true
      };

      console.log(`🚀 Sending streaming request to ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: this.abortController.signal
      });

      if (!response.ok) throw new Error(`API failed: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        if (onChunk) onChunk(chunk, fullContent);
      }

      if (onComplete) onComplete(fullContent);
      this.abortController = null;
      return fullContent;
    } catch (error) {
      this.abortController = null;
      if (error.name === 'AbortError') {
        console.log('⛔ Generation aborted');
        return null;
      }
      console.error('Streaming request error:', error);
      if (onError) onError(error);
      throw error;
    }
  },

  // NON-STREAMING MESSAGE HANDLER
  async sendNonStreamingMessage(messages, options = {}) {
    try {
      const prompt = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');
      const encodedPrompt = encodeURIComponent(prompt);

      const baseURL =
        this.currentModelType === 'image'
          ? this.baseImageURL
          : this.baseTextURL;
      const endpoint =
        this.currentModelType === 'image'
          ? `${baseURL}/prompt/${encodedPrompt}`
          : `${baseURL}/openai/${encodedPrompt}`;

      const body = {
        model: options.model || this.currentModel,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 4096,
        stream: false
      };

      console.log(`🟢 Sending non-stream request to ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error(`API failed: ${response.status}`);

      if (this.currentModelType === 'image') {
        // For image models, Pollinations returns an image URL or base64
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        return imageUrl;
      } else {
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error('Non-streaming request error:', error);
      throw error;
    }
  },

  // Abort current generation
  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('🛑 Generation stopped');
    }
  },

  // Other utilities
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  },

  estimateCost(tokens, modelId) {
    const costPerToken = 0.00002;
    return tokens * costPerToken;
  },

  getStats() {
    return {
      currentModel: this.currentModel,
      currentModelType: this.currentModelType,
      totalTextModels: this.textModels.length,
      totalImageModels: this.imageModels.length,
      isGenerating: this.abortController !== null
    };
  }
};

// Export globally
window.API = API;
