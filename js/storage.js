// storage.js - Local storage management

const Storage = {
  KEYS: {
    CHATS: 'pollinations_chats',
    ACTIVE_CHAT: 'pollinations_active_chat',
    THEME: 'pollinations_theme',
    ACCENT_COLOR: 'pollinations_accent_color',
    CANVAS_DATA: 'pollinations_canvas_data'
  },

  // Get all chats from storage
  getChats() {
    try {
      const chats = localStorage.getItem(this.KEYS.CHATS);
      return chats ? JSON.parse(chats) : [];
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  },

  // Save all chats to storage
  saveChats(chats) {
    try {
      // Process chats to remove file attachments before saving
      const chatsToSave = chats.map(chat => {
        const chatToSave = { ...chat };
        chatToSave.messages = chatToSave.messages.map(msg => {
          const msgToSave = { ...msg };
          // Remove file data from attachments to save space
          if (msgToSave.attachments) {
            msgToSave.attachments = msgToSave.attachments.map(attachment => {
              const attachmentToSave = { ...attachment };
              // Keep only metadata, not the actual file data
              delete attachmentToSave.data;
              delete attachmentToSave.thumbnail;
              return attachmentToSave;
            });
          }
          return msgToSave;
        });
        return chatToSave;
      });

      localStorage.setItem(this.KEYS.CHATS, JSON.stringify(chatsToSave));
      return true;
    } catch (error) {
      console.error('Error saving chats:', error);
      return false;
    }
  },

  // Get active chat ID
  getActiveChatId() {
    return localStorage.getItem(this.KEYS.ACTIVE_CHAT);
  },

  // Save active chat ID
  saveActiveChatId(chatId) {
    try {
      localStorage.setItem(this.KEYS.ACTIVE_CHAT, chatId);
      return true;
    } catch (error) {
      console.error('Error saving active chat:', error);
      return false;
    }
  },

  // Get theme preference
  getTheme() {
    return localStorage.getItem(this.KEYS.THEME) || 'light';
  },

  // Save theme preference
  saveTheme(theme) {
    try {
      localStorage.setItem(this.KEYS.THEME, theme);
      return true;
    } catch (error) {
      console.error('Error saving theme:', error);
      return false;
    }
  },

  // Get accent color preference
  getAccentColor() {
    return localStorage.getItem(this.KEYS.ACCENT_COLOR) || 'gradient';
  },

  // Save accent color preference
  saveAccentColor(accentColor) {
    try {
      localStorage.setItem(this.KEYS.ACCENT_COLOR, accentColor);
      return true;
    } catch (error) {
      console.error('Error saving accent color:', error);
      return false;
    }
  },

  // Clear all data
  clear() {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};

// Export for use in other modules
window.Storage = Storage;
