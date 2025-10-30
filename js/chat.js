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

      // Send to API with streaming
      await window.API.sendMessage(
        messages,
        // onChunk - called for each chunk of text
        (chunk, fullContent) => {
          assistantMessage.content = fullContent;
          assistantMessage.isStreaming = true;
          this.renderMessages(false); // Don't scroll aggressively during streaming
        },
        // onComplete - called when done
        (fullContent) => {
          assistantMessage.content = fullContent;
          assistantMessage.isStreaming = false;
          this.saveChats();
          this.renderMessages();
        },
        // onError - called on error
        (error) => {
          console.error('API Error:', error);
          assistantMessage.content = '❌ Sorry, there was an error generating a response. Please try again.';
          assistantMessage.isStreaming = false;
          assistantMessage.isError = true;
          this.saveChats();
          this.renderMessages();
          window.UI.showToast('Error: ' + error.message);
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      window.UI.showToast('Failed to send message');
    } finally {
      this.isGenerating = false;
    }
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
    sendBtn.disabled = !hasContent || this.isGenerating;
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

  // Render messages in chat area
  renderMessages(shouldScroll = true) {
    const messagesArea = document.getElementById('messagesArea');
    if (!messagesArea) return;

    const activeChat = this.getActiveChat();
    if (!activeChat) return;

    const container = messagesArea.querySelector('.messages-container') || document.createElement('div');
    container.className = 'messages-container';
    container.innerHTML = '';

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

      bubble.appendChild(content);
      bubble.appendChild(timestamp);

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

    if (container.parentElement !== messagesArea) {
      messagesArea.appendChild(container);
    }

    // Scroll to bottom
    if (shouldScroll) {
      requestAnimationFrame(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      });
    }

    // Update chat title in header
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) {
      chatTitle.textContent = activeChat.title;
    }
  }
};

// Export for use in other modules
window.Chat = Chat;
