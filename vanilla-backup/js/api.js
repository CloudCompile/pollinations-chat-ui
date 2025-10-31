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
          this.textModels = textData.map(model => ({
            id: model.name || model.id || model,
            name: model.description || this.formatModelName(model.name || model.id || model),
            type: 'text'
          }));
        }
      } else this.textModels = this.getDefaultTextModels();

      if (imageResponse.status === 'fulfilled' && imageResponse.value.ok) {
        const imageData = await imageResponse.value.json();
        if (Array.isArray(imageData)) {
          this.imageModels = imageData.map(model => ({
            id: model.name || model.id || model,
            name: model.description || this.formatModelName(model.name || model.id || model),
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
  updateModelSelector(filterType = 'text') {
    const modelList = document.getElementById('modelList');
    if (!modelList) return;
    
    modelList.innerHTML = '';
    
    // Determine which models to show based on filter
    const modelsToShow = filterType === 'image' ? this.imageModels : this.textModels;
    
    if (modelsToShow.length > 0) {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'model-group-label';
      groupLabel.textContent = filterType === 'image' ? '�️ Image Models' : '�💬 Text Models';
      modelList.appendChild(groupLabel);
      
      modelsToShow.forEach(model => {
        const item = document.createElement('div');
        item.className = 'model-item';
        if (model.id === this.currentModel) {
          item.classList.add('active');
        }
        item.setAttribute('data-model-id', model.id);
        item.setAttribute('data-model-type', filterType);
        
        const icon = document.createElement('div');
        icon.className = 'model-item-icon';
        icon.textContent = filterType === 'image' ? '🖼️' : '💬';
        
        const info = document.createElement('div');
        info.className = 'model-item-info';
        
        const name = document.createElement('div');
        name.className = 'model-item-name';
        name.textContent = model.name;
        
        info.appendChild(name);
        item.appendChild(icon);
        item.appendChild(info);
        
        modelList.appendChild(item);
      });
    }
    
    // Update current model display
    this.updateCurrentModelDisplay();
  },
  
  // Update the displayed current model name
  updateCurrentModelDisplay() {
    const currentModelName = document.getElementById('currentModelName');
    if (!currentModelName) return;
    
    const allModels = [...this.textModels, ...this.imageModels];
    const currentModel = allModels.find(m => m.id === this.currentModel);
    
    if (currentModel) {
      currentModelName.textContent = currentModel.name;
    }
  },

  // Set model
  setModel(modelId) {
    this.currentModel = modelId;
    const isText = this.textModels.some(m => m.id === modelId);
    const isImage = this.imageModels.some(m => m.id === modelId);
    this.currentModelType = isImage ? 'image' : 'text';
    console.log(`Model set to: ${modelId} (${this.currentModelType})`);
    this.updateCurrentModelDisplay();
  },

  // Format messages for API
  formatMessagesForAPI(messages) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  },

  // STREAMING MESSAGE HANDLER
  async sendMessage(messages, onChunk, onComplete, onError) {
    try {
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();

      // Build the conversation context
      const prompt = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n') + '\nAssistant:';
      
      const encodedPrompt = encodeURIComponent(prompt);

      // Generate random 32-bit integer seed to prevent caching
      const seed = Math.floor(Math.random() * 2147483647);

      // Build URL based on model type
      const baseURL = this.currentModelType === 'image' ? this.baseImageURL : this.baseTextURL;
      const url = `${baseURL}/${encodedPrompt}?model=${this.currentModel}&seed=${seed}`;

      console.log(`🚀 Sending streaming request with seed ${seed}`);

      const response = await fetch(url, {
        method: 'GET',
        signal: this.abortController.signal
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
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        chunkCount++;
        fullContent += chunk;
        console.log(`📦 Chunk ${chunkCount}: +${chunk.length} chars, total: ${fullContent.length}`);
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
