// api.js - Pollinations.ai API Integration

const API = {
  baseURL: 'https://text.pollinations.ai',
  modelsEndpoint: 'https://text.pollinations.ai/openai/models',
  models: [],
  currentModel: 'openai',
  abortController: null,

  // Initialize API module
  async init() {
    console.log('Initializing Pollinations API...');
    await this.loadModels();
  },

  // Load available models from the API
  async loadModels() {
    try {
      const response = await fetch(this.modelsEndpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract model IDs from the response
      if (data && data.data && Array.isArray(data.data)) {
        this.models = data.data.map(model => ({
          id: model.id,
          name: this.formatModelName(model.id),
          created: model.created,
          object: model.object
        }));
        
        console.log(`Loaded ${this.models.length} models from Pollinations API`);
        
        // Update model selector in UI
        this.updateModelSelector();
      } else {
        console.warn('Unexpected models response format:', data);
        this.setDefaultModels();
      }
    } catch (error) {
      console.error('Error loading models:', error);
      this.setDefaultModels();
    }
  },

  // Format model name for display
  formatModelName(modelId) {
    // Convert model ID to readable name
    return modelId
      .split('/')
      .pop()
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Set default models if API fetch fails
  setDefaultModels() {
    this.models = [
      { id: 'openai', name: 'OpenAI' },
      { id: 'mistral', name: 'Mistral' },
      { id: 'mistral-large', name: 'Mistral Large' },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B' },
      { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B' }
    ];
    this.updateModelSelector();
  },

  // Update the model selector dropdown in the UI
  updateModelSelector() {
    const modelSelector = document.getElementById('modelSelector');
    if (!modelSelector) return;

    // Clear existing options
    modelSelector.innerHTML = '';

    // Add models as options
    this.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      modelSelector.appendChild(option);
    });

    // Set current model
    if (this.currentModel) {
      modelSelector.value = this.currentModel;
    }
  },

  // Set the current model
  setModel(modelId) {
    this.currentModel = modelId;
    console.log('Model changed to:', modelId);
  },

  // Send a message to the API and get streaming response
  async sendMessage(messages, onChunk, onComplete, onError) {
    try {
      // Abort any ongoing request
      if (this.abortController) {
        this.abortController.abort();
      }

      this.abortController = new AbortController();

      // Prepare the request body
      const requestBody = {
        model: this.currentModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true,
        temperature: 0.7,
        max_tokens: 4096
      };

      console.log('Sending request to Pollinations API:', requestBody);

      // Make the streaming request
      const response = await fetch(`${this.baseURL}/openai/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // Process the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          break;
        }

        // Decode the chunk
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine === '') continue;
          if (trimmedLine === 'data: [DONE]') continue;
          if (!trimmedLine.startsWith('data: ')) continue;

          try {
            const jsonStr = trimmedLine.substring(6); // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr);

            if (data.choices && data.choices[0] && data.choices[0].delta) {
              const content = data.choices[0].delta.content;
              
              if (content) {
                fullContent += content;
                if (onChunk) {
                  onChunk(content, fullContent);
                }
              }

              // Check if this is the final chunk
              if (data.choices[0].finish_reason === 'stop') {
                console.log('Received finish signal');
              }
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError, trimmedLine);
          }
        }
      }

      if (onComplete) {
        onComplete(fullContent);
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      console.error('API error:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      this.abortController = null;
    }
  },

  // Stop the current request
  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('Generation stopped');
    }
  },

  // Format messages for API
  formatMessagesForAPI(chatMessages) {
    return chatMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  },

  // Check if API is available
  async checkAPIStatus() {
    try {
      const response = await fetch(this.modelsEndpoint, {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.error('API status check failed:', error);
      return false;
    }
  }
};

// Export for use in other modules
window.API = API;

  // Get model information
  getModelInfo(modelId) {
    return this.models.find(m => m.id === modelId) || null;
  },

  // Get current model info
  getCurrentModelInfo() {
    return this.getModelInfo(this.currentModel);
  },

  // Build request with custom parameters
  buildRequest(messages, options = {}) {
    return {
      model: options.model || this.currentModel,
      messages: messages,
      stream: options.stream !== false,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4096,
      top_p: options.top_p || 0.9,
      frequency_penalty: options.frequency_penalty || 0,
      presence_penalty: options.presence_penalty || 0,
      ...options.extra
    };
  },

  // Send non-streaming request
  async sendNonStreamingMessage(messages, options = {}) {
    try {
      const requestBody = this.buildRequest(messages, { ...options, stream: false });

      const response = await fetch(`${this.baseURL}/openai/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          content: data.choices[0].message.content,
          model: data.model,
          usage: data.usage
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Non-streaming API error:', error);
      throw error;
    }
  },

  // Get embeddings
  async getEmbeddings(text, model = 'text-embedding-ada-002') {
    try {
      const response = await fetch(`${this.baseURL}/openai/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`Embeddings request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Embeddings error:', error);
      throw error;
    }
  },

  // Count tokens (approximation)
  estimateTokens(text) {
    // Rough estimation: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  },

  // Calculate message cost (approximation based on token count)
  estimateCost(messages, modelId = null) {
    const model = modelId || this.currentModel;
    const totalTokens = messages.reduce((sum, msg) => {
      return sum + this.estimateTokens(msg.content);
    }, 0);

    // Cost per 1k tokens (these are example values)
    const costPer1k = {
      'openai': 0.002,
      'gpt-4': 0.03,
      'claude-3.5-sonnet': 0.003,
      'mistral': 0.001,
      'llama-3.1-70b': 0.0008
    };

    const rate = costPer1k[model] || 0.001;
    return (totalTokens / 1000) * rate;
  },

  // Retry logic wrapper
  async withRetry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`Retry ${i + 1}/${maxRetries} after error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(this.modelsEndpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // Get API statistics
  getStats() {
    return {
      currentModel: this.currentModel,
      totalModels: this.models.length,
      availableModels: this.models.map(m => m.name),
      isGenerating: this.abortController !== null
    };
  }
};

// Export for use in other modules
window.API = API;
