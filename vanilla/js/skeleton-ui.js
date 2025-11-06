// skeleton-ui.js - Skeleton UI components for loading states

const SkeletonUI = {
  // Create a skeleton message element
  createSkeletonMessage(isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `skeleton-message ${isUser ? 'user' : 'assistant'}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'skeleton-avatar';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'skeleton-content';
    
    // Create skeleton lines
    const line1 = document.createElement('div');
    line1.className = 'skeleton-line';
    
    const line2 = document.createElement('div');
    line2.className = 'skeleton-line short';
    
    const line3 = document.createElement('div');
    line3.className = 'skeleton-line';
    
    contentDiv.appendChild(line1);
    contentDiv.appendChild(line2);
    contentDiv.appendChild(line3);
    
    if (isUser) {
      messageDiv.appendChild(contentDiv);
      messageDiv.appendChild(avatarDiv);
    } else {
      messageDiv.appendChild(avatarDiv);
      messageDiv.appendChild(contentDiv);
    }
    
    return messageDiv;
  },

  // Create a skeleton chat interface
  createSkeletonChat() {
    const chatDiv = document.createElement('div');
    chatDiv.className = 'skeleton-chat';
    
    // Header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'skeleton-header';
    
    const headerLeftDiv = document.createElement('div');
    headerLeftDiv.className = 'skeleton-header-left';
    
    const menuButton = document.createElement('div');
    menuButton.className = 'skeleton-button';
    
    const modelSelector = document.createElement('div');
    modelSelector.className = 'skeleton-model-selector';
    
    headerLeftDiv.appendChild(menuButton);
    headerLeftDiv.appendChild(modelSelector);
    
    const headerRightDiv = document.createElement('div');
    headerRightDiv.className = 'skeleton-header-right';
    
    const button1 = document.createElement('div');
    button1.className = 'skeleton-button';
    
    const button2 = document.createElement('div');
    button2.className = 'skeleton-button';
    
    const button3 = document.createElement('div');
    button3.className = 'skeleton-button';
    
    headerRightDiv.appendChild(button1);
    headerRightDiv.appendChild(button2);
    headerRightDiv.appendChild(button3);
    
    headerDiv.appendChild(headerLeftDiv);
    headerDiv.appendChild(headerRightDiv);
    
    // Messages area
    const messagesDiv = document.createElement('div');
    messagesDiv.className = 'skeleton-messages';
    
    // Add skeleton messages
    for (let i = 0; i < 5; i++) {
      const isUser = i % 2 === 1;
      messagesDiv.appendChild(this.createSkeletonMessage(isUser));
    }
    
    // Input area
    const inputDiv = document.createElement('div');
    inputDiv.className = 'skeleton-input';
    
    const textareaDiv = document.createElement('div');
    textareaDiv.className = 'skeleton-textarea';
    
    const sendButton = document.createElement('div');
    sendButton.className = 'skeleton-send-button';
    
    inputDiv.appendChild(textareaDiv);
    inputDiv.appendChild(sendButton);
    
    // Assemble everything
    chatDiv.appendChild(headerDiv);
    chatDiv.appendChild(messagesDiv);
    chatDiv.appendChild(inputDiv);
    
    return chatDiv;
  },

  // Show skeleton chat in the messages area
  showSkeletonChat() {
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
      // Clear existing content
      messagesArea.innerHTML = '';
      
      // Add skeleton chat
      const skeletonChat = this.createSkeletonChat();
      messagesArea.appendChild(skeletonChat);
    }
  },

  // Hide skeleton chat
  hideSkeletonChat() {
    const messagesArea = document.getElementById('messagesArea');
    if (messagesArea) {
      // Clear skeleton content
      messagesArea.innerHTML = '';
    }
  }
};

// Export for global access
window.SkeletonUI = SkeletonUI;