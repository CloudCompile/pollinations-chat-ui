import { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { sendMessage, stopGeneration, formatMessagesForAPI, initializeModels, MODELS } from './utils/api';
import { getSelectedModel, saveSelectedModel, getTheme, saveTheme, getAccentColor, saveAccentColor } from './utils/storage';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageArea from './components/MessageArea';
import ChatInput from './components/ChatInput';
import ThemesModal from './components/ThemesModal';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import './App.css';

function App() {
  const {
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
    removeMessagesAfter,
    clearAllChats
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai');
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('gradient');
  const [isThemesModalOpen, setIsThemesModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Initialize models on mount
  useEffect(() => {
    const init = async () => {
      console.log('Initializing Pollinations API...');
      await initializeModels();
      setModelsLoaded(true);
      console.log('Models loaded:', MODELS);
    };
    init();
  }, []);

  useEffect(() => {
    const savedModel = getSelectedModel();
    const savedTheme = getTheme();
    const savedAccent = getAccentColor();
    setSelectedModel(savedModel);
    setTheme(savedTheme);
    setAccentColor(savedAccent);
    
    // Apply theme to document
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    document.body.setAttribute('data-accent', savedAccent);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K: Focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('messageInput')?.focus();
      }
      // Ctrl+N: New chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addChat();
      }
      // Ctrl+B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Ctrl+Shift+L: Toggle theme
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        handleThemeToggle();
      }
      // Esc: Close modals
      if (e.key === 'Escape') {
        setIsThemesModalOpen(false);
        setIsShortcutsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addChat]);

  const handleModelChange = (model) => {
    setSelectedModel(model);
    saveSelectedModel(model);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    saveTheme(newTheme);
    
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const handleAccentChange = (accent) => {
    setAccentColor(accent);
    saveAccentColor(accent);
    document.body.setAttribute('data-accent', accent);
  };

  const handleExportChat = () => {
    const activeChat = getActiveChat();
    if (!activeChat || !activeChat.messages.length) {
      alert('No messages to export');
      return;
    }

    // Create export data
    const exportData = {
      title: activeChat.title,
      timestamp: new Date().toISOString(),
      messages: activeChat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    };

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all chats? This action cannot be undone.')) {
      clearAllChats();
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || isGenerating) return;

    // Add user message
    addMessage('user', content);

    // Set generating state
    setIsGenerating(true);

    const activeChat = getActiveChat();
    if (!activeChat) return;

    // Prepare messages for API
    const messages = formatMessagesForAPI([...activeChat.messages, {
      role: 'user',
      content
    }]);

    // Create assistant message
    const assistantMessageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    addMessage('assistant', '');
    
    try {
      await sendMessage(
        messages,
        // onChunk
        (chunk, fullContent) => {
          updateMessage(assistantMessageId, {
            content: fullContent,
            isStreaming: true
          });
        },
        // onComplete
        (fullContent) => {
          updateMessage(assistantMessageId, {
            content: fullContent,
            isStreaming: false
          });
          setIsGenerating(false);
        },
        // onError
        (error) => {
          updateMessage(assistantMessageId, {
            content: `❌ Sorry, there was an error: ${error.message}`,
            isStreaming: false,
            isError: true
          });
          setIsGenerating(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    stopGeneration();
    setIsGenerating(false);
  };

  const handleRegenerateMessage = async () => {
    const activeChat = getActiveChat();
    if (!activeChat || isGenerating) return;

    const messages = activeChat.messages;
    if (messages.length < 2) return;

    // Find the last user message
    let lastUserMessage = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i];
        break;
      }
    }

    if (!lastUserMessage) return;

    // Remove all messages after the last user message
    removeMessagesAfter(lastUserMessage.timestamp);

    // Wait a bit for state to update
    setTimeout(() => {
      // Regenerate the response by re-processing the messages
      setIsGenerating(true);

      const updatedChat = getActiveChat();
      const apiMessages = formatMessagesForAPI(updatedChat.messages);

      // Create assistant message
      const assistantMessageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      addMessage('assistant', '');
      
      sendMessage(
        apiMessages,
        (chunk, fullContent) => {
          updateMessage(assistantMessageId, {
            content: fullContent,
            isStreaming: true
          });
        },
        (fullContent) => {
          updateMessage(assistantMessageId, {
            content: fullContent,
            isStreaming: false
          });
          setIsGenerating(false);
        },
        (error) => {
          updateMessage(assistantMessageId, {
            content: `❌ Sorry, there was an error: ${error.message}`,
            isStreaming: false,
            isError: true
          });
          setIsGenerating(false);
        }
      );
    }, 100);
  };

  const activeChat = getActiveChat();

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onChatSelect={setActiveChat}
        onNewChat={addChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="chat-container">
        <ChatHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onThemeToggle={handleThemeToggle}
          onThemesClick={() => setIsThemesModalOpen(true)}
          onExportChat={handleExportChat}
          onClearAll={handleClearAll}
        />
        
        <MessageArea
          messages={activeChat?.messages || []}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerateMessage}
        />
        
        <ChatInput
          onSend={handleSendMessage}
          isGenerating={isGenerating}
          onStop={handleStopGeneration}
        />
      </div>

      <ThemesModal
        isOpen={isThemesModalOpen}
        onClose={() => setIsThemesModalOpen(false)}
        onAccentChange={handleAccentChange}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}

export default App;
