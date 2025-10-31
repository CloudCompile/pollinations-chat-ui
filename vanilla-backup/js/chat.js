// chat.js - Chat message management

const Chat = {
  chats: [],
  activeChatId: null,
  isGenerating: false,

  // Initialize chat module
  init() {
    this.loadChats();
    this.setupEventListeners();
    this.render();
  },

  // Load chats from storage
  loadChats() {
    const storedChats = window.Storage.getChats();
    const storedActiveChatId = window.Storage.getActiveChatId();

    if (storedChats.length > 0) {
      this.chats = storedChats;
      this.activeChatId = storedActiveChatId || storedChats[0].id;
    } else {
      // Create initial chat
      const initialChat = this.createChat('New Chat');
      this.chats = [initialChat];
      this.activeChatId = initialChat.id;
      this.saveChats();
    }
  },

  // Save chats to storage
  saveChats() {
    window.Storage.saveChats(this.chats);
    window.Storage.saveActiveChatId(this.activeChatId);
  },

  // Create a new chat
  createChat(title = 'New Chat') {
    return {
      id: window.UI.generateId(),
      title: title,
      messages: [],
      createdAt: Date.now()
    };
  },

  // Add a new chat
  addChat() {
    const newChat = this.createChat();
    this.chats.unshift(newChat);
    this.activeChatId = newChat.id;
    this.saveChats();
    this.render();
    window.UI.showToast('New chat created');
  },

  // Delete a chat
  deleteChat(chatId) {
    const index = this.chats.findIndex(c => c.id === chatId);
    if (index === -1) return;

    this.chats.splice(index, 1);

    // If we deleted the active chat, switch to another
    if (this.activeChatId === chatId) {
      if (this.chats.length > 0) {
        this.activeChatId = this.chats[0].id;
      } else {
        // Create a new chat if we deleted the last one
        const newChat = this.createChat();
        this.chats = [newChat];
        this.activeChatId = newChat.id;
      }
    }

    this.saveChats();
    this.render();
  },

  // Set active chat
  setActiveChat(chatId) {
    this.activeChatId = chatId;
    this.saveChats();
    this.render();
  },

  // Get active chat
  getActiveChat() {
    return this.chats.find(c => c.id === this.activeChatId);
  },

  // Add message to active chat
  addMessage(role, content) {
    const activeChat = this.getActiveChat();
    if (!activeChat) return;

    const message = {
      id: window.UI.generateId(),
      role: role,
      content: content,
      timestamp: Date.now()
    };

    activeChat.messages.push(message);

    // Update chat title based on first user message
    if (activeChat.messages.length === 1 && role === 'user') {
      activeChat.title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
    }

    this.saveChats();
    this.renderMessages();
  },

  // Send a user message
  async sendMessage(content) {
    if (!content.trim() || this.isGenerating) return;

    // Add user message
    this.addMessage('user', content);

    // Show typing indicator
    this.isGenerating = true;
    this.renderMessages();

    try {
      // Get all messages for context
      const activeChat = this.getActiveChat();
      if (!activeChat) return;

      // Prepare messages for API
      const messages = window.API.formatMessagesForAPI(activeChat.messages);

      // Create a temporary assistant message for streaming
      const assistantMessage = {
        id: window.UI.generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      };

      activeChat.messages.push(assistantMessage);
      this.saveChats();
      this.renderMessages();

      let retryCount = 0;
      const maxRetries = 2;

      const attemptSend = async () => {
        try {
          // Send to API with streaming
          await window.API.sendMessage(
            messages,
            // onChunk - called for each chunk of text
            (chunk, fullContent) => {
              assistantMessage.content = fullContent;
              assistantMessage.isStreaming = true;
              this.updateStreamingMessage(assistantMessage.id, fullContent);
            },
            // onComplete - called when done
            (fullContent) => {
              assistantMessage.content = fullContent;
              assistantMessage.isStreaming = false;
              this.saveChats();
              this.renderMessages();
            },
            // onError - called on error
            async (error) => {
              console.error('API Error:', error);
              
              // Retry logic
              if (retryCount < maxRetries && error.message !== 'User aborted') {
                retryCount++;
                console.log(`Retrying... Attempt ${retryCount} of ${maxRetries}`);
                window.UI.showToast(`Retrying... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                await attemptSend();
              } else {
                assistantMessage.content = `❌ Sorry, there was an error generating a response. ${error.message || 'Please try again.'}\n\n*Tip: Try regenerating the response or check your connection.*`;
                assistantMessage.isStreaming = false;
                assistantMessage.isError = true;
                this.saveChats();
                this.renderMessages();
                window.UI.showToast('Error: ' + error.message);
              }
            }
          );
        } catch (err) {
          throw err;
        }
      };

      await attemptSend();

    } catch (error) {
      console.error('Error sending message:', error);
      window.UI.showToast('Failed to send message');
    } finally {
      this.isGenerating = false;
      this.renderMessages();
    }
  },

  // Regenerate the last assistant message
  async regenerateLastMessage() {
    const activeChat = this.getActiveChat();
    if (!activeChat || activeChat.messages.length < 2) return;

    // Find last user message
    let lastUserIndex = -1;
    for (let i = activeChat.messages.length - 1; i >= 0; i--) {
      if (activeChat.messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    // Remove all messages after the last user message
    activeChat.messages = activeChat.messages.slice(0, lastUserIndex + 1);
    this.saveChats();
    
    // Resend
    const lastUserMessage = activeChat.messages[lastUserIndex].content;
    this.isGenerating = true;
    this.renderMessages();

    // Use sendMessage logic but without adding new user message
    try {
      const messages = window.API.formatMessagesForAPI(activeChat.messages);

      const assistantMessage = {
        id: window.UI.generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      };

      activeChat.messages.push(assistantMessage);
      this.saveChats();
      this.renderMessages();

      await window.API.sendMessage(
        messages,
        (chunk, fullContent) => {
          assistantMessage.content = fullContent;
          assistantMessage.isStreaming = true;
          this.updateStreamingMessage(assistantMessage.id, fullContent);
        },
        (fullContent) => {
          assistantMessage.content = fullContent;
          assistantMessage.isStreaming = false;
          this.saveChats();
          this.renderMessages();
        },
        (error) => {
          assistantMessage.content = `❌ Error regenerating response: ${error.message}`;
          assistantMessage.isStreaming = false;
          assistantMessage.isError = true;
          this.saveChats();
          this.renderMessages();
        }
      );
    } catch (error) {
      console.error('Error regenerating:', error);
    } finally {
      this.isGenerating = false;
    }
  },

  // Stop generation
  stopGeneration() {
    if (window.API) {
      window.API.stopGeneration();
    }
    this.isGenerating = false;
    
    // Mark current streaming message as stopped
    const activeChat = this.getActiveChat();
    if (activeChat) {
      const streamingMsg = activeChat.messages.find(m => m.isStreaming);
      if (streamingMsg) {
        streamingMsg.isStreaming = false;
        streamingMsg.content += '\n\n*(Generation stopped)*';
        this.saveChats();
      }
    }
    
    this.renderMessages();
  },

  // Setup event listeners
  setupEventListeners() {
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    sendBtn.addEventListener('click', () => {
      this.sendMessage(messageInput.value);
      messageInput.value = '';
      messageInput.style.height = 'auto';
      this.updateSendButton();
    });

    // Enter to send
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(messageInput.value);
        messageInput.value = '';
        messageInput.style.height = 'auto';
        this.updateSendButton();
      }
    });

    // Auto-resize textarea and update send button
    messageInput.addEventListener('input', (e) => {
      window.UI.autoResizeTextarea(e.target);
      this.updateSendButton();
    });
  },

  // Update send button state
  updateSendButton() {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    const hasContent = messageInput.value.trim().length > 0;
    
    if (this.isGenerating) {
      sendBtn.disabled = false;
      sendBtn.title = 'Stop generation';
      sendBtn.classList.add('stop-generating');
      sendBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" fill="white"/>
        </svg>
      `;
      sendBtn.onclick = () => this.stopGeneration();
    } else {
      sendBtn.disabled = !hasContent;
      sendBtn.title = 'Send message';
      sendBtn.classList.remove('stop-generating');
      sendBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <path d="M10 8l6 4-6 4V8z" fill="white"/>
        </svg>
      `;
      sendBtn.onclick = null; // Remove stop handler
    }
  },

  // Render everything
  render() {
    this.renderChatList();
    this.renderMessages();
  },

  // Render chat list in sidebar
  renderChatList() {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;

    chatList.innerHTML = '';

    this.chats.forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.className = `chat-item ${chat.id === this.activeChatId ? 'active' : ''}`;
      chatItem.innerHTML = `
        <div class="chat-item-title truncate">${window.UI.escapeHtml(chat.title)}</div>
        <div class="chat-item-meta">${chat.messages.length} message${chat.messages.length !== 1 ? 's' : ''}</div>
        <button class="chat-item-delete" aria-label="Delete chat">
          ${window.UI.createIcon('trash')}
        </button>
      `;

      chatItem.addEventListener('click', (e) => {
        if (!e.target.closest('.chat-item-delete')) {
          this.setActiveChat(chat.id);
        }
      });

      const deleteBtn = chatItem.querySelector('.chat-item-delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this chat?')) {
          this.deleteChat(chat.id);
        }
      });

      chatList.appendChild(chatItem);
    });
  },

  // Update streaming message content efficiently without re-rendering everything
  updateStreamingMessage(messageId, content) {
    const messageRow = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageRow) {
      // If message row doesn't exist yet, render all messages
      console.log('⚠️ Message row not found, rendering all messages');
      this.renderMessages(false);
      return;
    }

    const messageContent = messageRow.querySelector('.message-content');
    if (messageContent) {
      // Update content with markdown formatting
      if (window.Markdown) {
        messageContent.innerHTML = window.Markdown.formatMessage(content);
      } else {
        messageContent.textContent = content;
      }
      
      // Auto-scroll to bottom smoothly
      const messagesArea = document.getElementById('messagesArea');
      if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
    }
  },

  // Render messages in chat area
  renderMessages(shouldScroll = true) {
    const messagesArea = document.getElementById('messagesArea');
    if (!messagesArea) return;

    const activeChat = this.getActiveChat();
    if (!activeChat) return;

    // Show welcome screen if no messages
    if (activeChat.messages.length === 0 && !this.isGenerating) {
      // Rotating welcome messages
      const welcomeMessages = [
        "What's on the agenda today?",
        "How can I help you today?",
        "What would you like to create?",
        "Ready to explore new ideas?",
        "Let's build something amazing!"
      ];
      const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      
      messagesArea.innerHTML = `
        <div class="welcome-screen">
          <h1 class="welcome-title">${randomMessage}</h1>
        </div>
      `;
      return;
    }

    // Clear welcome screen and prepare container for messages
    const container = messagesArea.querySelector('.messages-container') || document.createElement('div');
    container.className = 'messages-container';
    container.innerHTML = '';

    // Render messages
    activeChat.messages.forEach((message, index) => {
      const messageRow = document.createElement('div');
      messageRow.className = `message-row ${message.role}`;
      messageRow.setAttribute('data-message-id', message.id);

      const avatar = document.createElement('div');
      avatar.className = `message-avatar ${message.role}`;
      avatar.innerHTML = window.UI.createIcon(message.role === 'user' ? 'user' : 'sparkles');

      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${message.role}`;
      
      // Add error class if needed
      if (message.isError) {
        bubble.classList.add('error');
      }

      // Add streaming class if needed
      if (message.isStreaming) {
        bubble.classList.add('streaming');
      }

      const content = document.createElement('div');
      content.className = 'message-content';
      
      // Use markdown rendering for assistant messages
      if (message.role === 'assistant' && window.Markdown) {
        content.innerHTML = window.Markdown.formatMessage(message.content);
      } else {
        // For user messages, just escape HTML
        content.textContent = message.content;
      }

      const timestamp = document.createElement('div');
      timestamp.className = 'message-timestamp';
      timestamp.textContent = window.UI.formatTime(message.timestamp);

      // Add action buttons for assistant messages
      if (message.role === 'assistant' && !message.isStreaming) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'message-action-btn';
        copyBtn.title = 'Copy message';
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        `;
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(message.content);
          window.UI.showToast('Message copied to clipboard');
        });

        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'message-action-btn';
        regenerateBtn.title = 'Regenerate response';
        regenerateBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
          </svg>
        `;
        regenerateBtn.addEventListener('click', () => {
          if (!this.isGenerating) {
            this.regenerateLastMessage();
          }
        });

        actions.appendChild(copyBtn);
        actions.appendChild(regenerateBtn);
        bubble.appendChild(content);
        bubble.appendChild(timestamp);
        bubble.appendChild(actions);
      } else {
        bubble.appendChild(content);
        bubble.appendChild(timestamp);
      }

      if (message.role === 'assistant') {
        messageRow.appendChild(avatar);
        messageRow.appendChild(bubble);
      } else {
        messageRow.appendChild(bubble);
        messageRow.appendChild(avatar);
      }

      container.appendChild(messageRow);
    });

    // Show typing indicator if generating but no streaming message yet
    const hasStreamingMessage = activeChat.messages.some(m => m.isStreaming);
    if (this.isGenerating && !hasStreamingMessage) {
      const typingRow = document.createElement('div');
      typingRow.className = 'message-row assistant';

      const avatar = document.createElement('div');
      avatar.className = 'message-avatar assistant';
      avatar.innerHTML = window.UI.createIcon('sparkles');

      const bubble = document.createElement('div');
      bubble.className = 'message-bubble assistant';
      bubble.innerHTML = `
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;

      typingRow.appendChild(avatar);
      typingRow.appendChild(bubble);
      container.appendChild(typingRow);
    }

    // Clear messagesArea and append container with messages
    if (container.parentElement !== messagesArea) {
      messagesArea.innerHTML = '';
      messagesArea.appendChild(container);
    }

    // Scroll to bottom
    if (shouldScroll) {
      requestAnimationFrame(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      });
    }
  }
};

// Export for use in other modules
window.Chat = Chat;
