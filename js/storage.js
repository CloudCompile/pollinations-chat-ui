// storage.js - Local storage management

const Storage = {
  KEYS: {
    CHATS: 'pollinations_chats',
    ACTIVE_CHAT: 'pollinations_active_chat',
    THEME: 'pollinations_theme'
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
      localStorage.setItem(this.KEYS.CHATS, JSON.stringify(chats));
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
