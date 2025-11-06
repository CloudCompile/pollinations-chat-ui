// virtualized-message-list.js - Virtualized message list component for better performance

const VirtualizedMessageList = {
  // State variables
  container: null,
  messages: [],
  visibleMessages: [],
  itemHeight: 100, // Approximate height of a message
  buffer: 5, // Number of messages to render outside viewport
  scrollTop: 0,
  containerHeight: 0,
  isInitialized: false,

  // Initialize the virtualized message list
  init(containerElement) {
    this.container = containerElement;
    this.setupEventListeners();
    this.isInitialized = true;
  },

  // Setup event listeners
  setupEventListeners() {
    if (!this.container) return;

    // Scroll event listener
    this.container.addEventListener('scroll', () => {
      this.handleScroll();
    });

    // Resize observer for container
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      resizeObserver.observe(this.container);
    }

    // Initial sizing
    this.handleResize();
  },

  // Handle scroll events
  handleScroll() {
    if (!this.container) return;
    
    const newScrollTop = this.container.scrollTop;
    if (newScrollTop !== this.scrollTop) {
      this.scrollTop = newScrollTop;
      this.updateVisibleMessages();
    }
  },

  // Handle resize events
  handleResize() {
    if (!this.container) return;
    
    const newHeight = this.container.clientHeight;
    if (newHeight !== this.containerHeight) {
      this.containerHeight = newHeight;
      this.updateVisibleMessages();
    }
  },

  // Set messages to display
  setMessages(messages) {
    this.messages = messages || [];
    this.updateVisibleMessages();
  },

  // Update which messages are visible
  updateVisibleMessages() {
    if (!this.container || !this.isInitialized) return;

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(
      this.messages.length - 1,
      Math.floor((this.scrollTop + this.containerHeight) / this.itemHeight) + this.buffer
    );

    // Check if we need to update
    const currentVisible = this.visibleMessages;
    if (currentVisible.startIndex === startIndex && currentVisible.endIndex === endIndex) {
      return; // No change needed
    }

    // Update visible range
    this.visibleMessages = {
      startIndex,
      endIndex,
      messages: this.messages.slice(startIndex, endIndex + 1)
    };

    // Render visible messages
    this.renderVisibleMessages();
  },

  // Render visible messages
  renderVisibleMessages() {
    if (!this.container) return;

    // Clear container
    this.container.innerHTML = '';

    // Add top placeholder
    const topPlaceholder = document.createElement('div');
    topPlaceholder.className = 'virtualized-message-placeholder';
    topPlaceholder.style.height = `${this.visibleMessages.startIndex * this.itemHeight}px`;
    this.container.appendChild(topPlaceholder);

    // Add visible messages
    const contentContainer = document.createElement('div');
    contentContainer.className = 'virtualized-message-list-content';
    
    this.visibleMessages.messages.forEach((message, index) => {
      const messageElement = this.createMessageElement(message);
      contentContainer.appendChild(messageElement);
    });
    
    this.container.appendChild(contentContainer);

    // Add bottom placeholder
    const bottomPlaceholder = document.createElement('div');
    bottomPlaceholder.className = 'virtualized-message-placeholder';
    const bottomHeight = Math.max(0, 
      (this.messages.length - this.visibleMessages.endIndex - 1) * this.itemHeight
    );
    bottomPlaceholder.style.height = `${bottomHeight}px`;
    this.container.appendChild(bottomPlaceholder);
  },

  // Create a message element
  createMessageElement(message) {
    // This is a simplified version - in a real implementation,
    // you would use the existing message rendering logic from chat.js
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;
    messageDiv.setAttribute('data-message-id', message.id);
    
    // Add avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar';
    avatarDiv.innerHTML = message.role === 'user' ? 
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' :
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    
    // Add content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (message.type === 'image') {
      const img = document.createElement('img');
      img.src = message.content;
      img.alt = 'Generated image';
      img.className = 'message-image';
      contentDiv.appendChild(img);
    } else {
      contentDiv.innerHTML = message.content;
    }
    
    // Assemble message
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
  },

  // Scroll to bottom of the list
  scrollToBottom() {
    if (!this.container) return;
    
    this.container.scrollTop = this.container.scrollHeight;
  },

  // Scroll to top of the list
  scrollToTop() {
    if (!this.container) return;
    
    this.container.scrollTop = 0;
  }
};

// Export for global access
window.VirtualizedMessageList = VirtualizedMessageList;