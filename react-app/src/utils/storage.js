// Storage utilities
const STORAGE_KEYS = {
  CHATS: 'pollinations_chats',
  ACTIVE_CHAT: 'pollinations_active_chat',
  THEME: 'pollinations_theme',
  MODEL: 'pollinations_selected_model',
  ACCENT_COLOR: 'pollinations_accent_color'
};

export const getChats = () => {
  try {
    const chats = localStorage.getItem(STORAGE_KEYS.CHATS);
    return chats ? JSON.parse(chats) : [];
  } catch (error) {
    console.error('Error loading chats:', error);
    return [];
  }
};

export const saveChats = (chats) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving chats:', error);
  }
};

export const getActiveChatId = () => {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT);
};

export const saveActiveChatId = (chatId) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, chatId);
};

export const getTheme = () => {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
};

export const saveTheme = (theme) => {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
};

export const getAccentColor = () => {
  return localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR) || 'gradient';
};

export const saveAccentColor = (accent) => {
  localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, accent);
};

export const getSelectedModel = () => {
  return localStorage.getItem(STORAGE_KEYS.MODEL) || 'openai';
};

export const saveSelectedModel = (model) => {
  localStorage.setItem(STORAGE_KEYS.MODEL, model);
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
