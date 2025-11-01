// API utilities for Pollinations chat
const MODELS = {
  'openai': 'openai',
  'mistral': 'mistral',
  'claude-3.5-sonnet': 'claude-3.5-sonnet',
  'gemini-pro': 'gemini-pro',
  'llama-3.1-70b': 'llama-3.1-70b',
  'grok-beta': 'grok-beta'
};

let abortController = null;

export const sendMessage = async (messages, onChunk, onComplete, onError) => {
  const model = localStorage.getItem('selectedModel') || 'openai';
  
  try {
    abortController = new AbortController();
    
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
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

export { MODELS };
