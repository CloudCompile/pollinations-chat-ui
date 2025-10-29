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

    // Simulate AI response (in real app, this would call an API)
    await this.simulateAIResponse(content);

    this.isGenerating = false;
    this.renderMessages();
  },

  // Simulate AI response (demo)
  async simulateAIResponse(userMessage) {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const responses = [
      `I understand you said: "${userMessage}". This is a demo response from Pollinations.ai. 🌟`,
      `Great question! Here's what I think about "${userMessage}":\n\n**Key Points:**\n- [x] Point one is important\n- [x] Point two builds on that\n- [ ] Point three needs more thought\n\nLet me know if you need more details!`,
      `Interesting! Regarding "${userMessage}", I can help with that. Here's some code:\n\n\`\`\`\nconst example = "Hello World";\nconsole.log(example);\n\`\`\`\n\nDoes this help?`,
      `Thanks for asking about "${userMessage}"! Let me explain with *emphasis* on the **important** parts. You can use \`inline code\` like this too! 😊`
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    this.addMessage('assistant', randomResponse);
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
  renderMessages() {
    const messagesArea = document.getElementById('messagesArea');
    if (!messagesArea) return;

    const activeChat = this.getActiveChat();
    if (!activeChat) return;

    const container = messagesArea.querySelector('.messages-container') || document.createElement('div');
    container.className = 'messages-container';
    container.innerHTML = '';

    // Show welcome screen if no messages
    if (activeChat.messages.length === 0 && !this.isGenerating) {
      messagesArea.innerHTML = `
        <div class="welcome-screen">
          <h1 class="welcome-title">What's on the agenda today?</h1>
        </div>
      `;
      return;
    }

    // Render messages
    activeChat.messages.forEach(message => {
      const messageRow = document.createElement('div');
      messageRow.className = `message-row ${message.role}`;

      const avatar = document.createElement('div');
      avatar.className = `message-avatar ${message.role}`;
      avatar.innerHTML = window.UI.createIcon(message.role === 'user' ? 'user' : 'sparkles');

      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${message.role}`;
      
      const content = document.createElement('div');
      content.className = 'message-content';
      content.innerHTML = window.UI.formatMessage(message.content);

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

    // Show typing indicator
    if (this.isGenerating) {
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

    messagesArea.innerHTML = '';
    messagesArea.appendChild(container);
    
    // Scroll to bottom
    setTimeout(() => window.UI.scrollToBottom(messagesArea), 100);

    // Update chat title in header
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) {
      chatTitle.textContent = activeChat.title;
    }
  }
};

// Export for use in other modules
window.Chat = Chat;
