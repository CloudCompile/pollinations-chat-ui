import { useState, useEffect } from 'react';
import { getChats, saveChats, getActiveChatId, saveActiveChatId, generateId } from '../utils/storage';

export const useChat = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load chats from storage on mount
  useEffect(() => {
    const storedChats = getChats();
    const storedActiveChatId = getActiveChatId();

    if (storedChats.length > 0) {
      setChats(storedChats);
      setActiveChatId(storedActiveChatId || storedChats[0].id);
    } else {
      // Create initial chat
      const initialChat = createNewChat('New Chat');
      setChats([initialChat]);
      setActiveChatId(initialChat.id);
    }
  }, []);

  // Save chats whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      saveChats(chats);
    }
  }, [chats]);

  // Save active chat ID whenever it changes
  useEffect(() => {
    if (activeChatId) {
      saveActiveChatId(activeChatId);
    }
  }, [activeChatId]);

  const createNewChat = (title = 'New Chat') => {
    return {
      id: generateId(),
      title,
      messages: [],
      createdAt: Date.now()
    };
  };

  const addChat = () => {
    const newChat = createNewChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    return newChat;
  };

  const deleteChat = (chatId) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== chatId);
      
      // If we deleted the active chat, switch to another
      if (activeChatId === chatId) {
        if (filtered.length > 0) {
          setActiveChatId(filtered[0].id);
        } else {
          // Create a new chat if we deleted the last one
          const newChat = createNewChat();
          setActiveChatId(newChat.id);
          return [newChat];
        }
      }
      
      return filtered;
    });
  };

  const setActiveChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const getActiveChat = () => {
    return chats.find(c => c.id === activeChatId);
  };

  const addMessage = (role, content) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        const newMessage = {
          id: generateId(),
          role,
          content,
          timestamp: Date.now()
        };
        
        const updatedMessages = [...chat.messages, newMessage];
        
        // Update chat title based on first user message
        let updatedTitle = chat.title;
        if (chat.messages.length === 0 && role === 'user') {
          // If content is an object with text property, use that for the title
          const titleText = typeof content === 'object' && content.text ? content.text : content;
          updatedTitle = titleText.substring(0, 40) + (titleText.length > 40 ? '...' : '');
        }
        
        return {
          ...chat,
          messages: updatedMessages,
          title: updatedTitle
        };
      }
      return chat;
    }));
  };

  const updateMessage = (messageId, updates) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
        };
      }
      return chat;
    }));
  };

  const removeLastMessage = () => {
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: chat.messages.slice(0, -1)
        };
      }
      return chat;
    }));
  };

  const removeMessagesAfter = (timestamp) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: chat.messages.filter(msg => msg.timestamp <= timestamp)
        };
      }
      return chat;
    }));
  };

  // Export chat functionality
  const exportChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return null;

    // Create a clean copy of the chat for export
    const exportData = {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      messages: chat.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${chat.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return exportData;
  };

  return {
    chats,
    activeChatId,
    isGenerating,
    setIsGenerating,
    addChat,
    deleteChat,
    setActiveChat,
    getActiveChat,
    addMessage,
    updateMessage,
    removeLastMessage,
    removeMessagesAfter,
    exportChat
  };
};
