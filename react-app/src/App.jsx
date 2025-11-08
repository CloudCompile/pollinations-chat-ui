import { useState, useEffect, useCallback, useMemo } from 'react';
import { useChat } from './hooks/useChat';
import { sendMessage, stopGeneration, formatMessagesForAPI, initializeModels, generateImage } from './utils/api';
import { getSelectedModel, saveSelectedModel, getTheme, saveTheme } from './utils/storage';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageArea from './components/MessageArea';
import ChatInput from './components/ChatInput';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ConfirmModal from './components/ConfirmModal';
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
  const [selectedImageModel, setSelectedImageModel] = useState('flux');
  const [theme, setTheme] = useState('dark');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [models, setModels] = useState({});
  const [imageModels, setImageModels] = useState({});
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDangerous: false
  });
  const [mode, setMode] = useState('chat');

  // Debug mode changes
  useEffect(() => {
    console.log('🔄 Mode changed to:', mode);
  }, [mode]);

  // Initialize models on mount
  useEffect(() => {
    const init = async () => {
      console.log('🚀 Initializing Pollinations API...');
      const { textModels, imageModels } = await initializeModels();
      setModels(textModels);
      setImageModels(imageModels);
      setModelsLoaded(true);
      console.log('✅ Text models loaded:', Object.keys(textModels));
      console.log('✅ Image models loaded:', Object.keys(imageModels));
    };
    init();
  }, []);

  useEffect(() => {
    const savedModel = getSelectedModel();
    const savedImageModel = localStorage.getItem('selectedImageModel') || 'flux';
    const savedTheme = getTheme();
    setSelectedModel(savedModel);
    setSelectedImageModel(savedImageModel);
    setTheme(savedTheme);
    
    // Apply theme to document
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
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
        setIsShortcutsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addChat]);

  const handleModelChange = useCallback((model) => {
    setSelectedModel(model);
    saveSelectedModel(model);
  }, []);

  const handleImageModelChange = useCallback((model) => {
    setSelectedImageModel(model);
    localStorage.setItem('selectedImageModel', model);
  }, []);

  const handleThemeToggle = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    saveTheme(newTheme);
    
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

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
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Chats',
      message: 'Are you sure you want to delete all chats? This action cannot be undone.',
      onConfirm: () => clearAllChats(),
      isDangerous: true
    });
  };

  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim() || isGenerating) return;

    // Add user message and get the updated chat
    const updatedChat = addMessage('user', content);

    // Set generating state
    setIsGenerating(true);

    if (!updatedChat) {
      console.error("Could not find active chat to send message.");
      setIsGenerating(false);
      // Show toast notification for error
      if (window?.showToast) window.showToast("Could not find active chat to send message.", "error");
      return;
    }

    // Prepare messages for API from the updated chat
    const messages = formatMessagesForAPI(updatedChat.messages);

    // Create assistant message placeholder
    const assistantMessageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    addMessage('assistant', '', assistantMessageId);
    
    // Immediately set it to streaming state
    updateMessage(assistantMessageId, {
      isStreaming: true
    });
    
    try {
      await sendMessage(
        messages,
        // onChunk
        (chunk, fullContent) => {
          // Update the message content in real-time for streaming
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
      updateMessage(assistantMessageId, {
        content: `❌ Sorry, there was an error: ${error.message}`,
        isStreaming: false,
        isError: true
      });
      setIsGenerating(false);
    }
  }, [isGenerating, addMessage, updateMessage]);

  const handleStopGeneration = useCallback(() => {
    stopGeneration();
    setIsGenerating(false);
  }, []);

  const handleGenerateImage = useCallback(async (prompt) => {
    if (!prompt.trim() || isGenerating) return;

    // Add user message with the prompt
    const updatedChat = addMessage('user', `/imagine ${prompt}`);
    
    // Set generating state
    setIsGenerating(true);

    if (!updatedChat) {
      console.error("Could not find active chat to generate image.");
      setIsGenerating(false);
      // Show toast notification for error
      if (window?.showToast) window.showToast("Could not find active chat to generate image.", "error");
      return;
    }

    // Create assistant message placeholder for the image
    const assistantMessageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    addMessage('assistant', 'Generating image...', assistantMessageId);

    try {
      console.log('🎨 Starting image generation with prompt:', prompt);
      
      // Generate the image with selected model
      const imageData = await generateImage(prompt, {
        model: selectedImageModel,
        width: 1024,
        height: 1024,
        enhance: true
      });

      // Update the message with the generated image
      updateMessage(assistantMessageId, {
        content: '',
        imageUrl: imageData.url,
        imagePrompt: imageData.prompt,
        imageModel: imageData.model,
        isStreaming: false
      });

      console.log('✅ Image generation complete');
      setIsGenerating(false);
    } catch (error) {
      console.error('❌ Image generation error:', error);
      updateMessage(assistantMessageId, {
        content: `❌ Sorry, there was an error generating the image: ${error.message}`,
        isStreaming: false,
        isError: true
      });
      setIsGenerating(false);
      // Show toast notification for error
      if (window?.showToast) window.showToast("Image generation failed: " + error.message, "error");
    }
  }, [isGenerating, selectedImageModel, addMessage, updateMessage]);

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

    // Log to check if messages are correctly removed
    console.log('Messages after removal:', getActiveChat().messages);

    // Wait a bit for state to update
    setTimeout(() => {
      // Regenerate the response by re-processing the messages
      setIsGenerating(true);
      console.log('State after timeout, isGenerating:', isGenerating);

      const updatedChat = getActiveChat();
      console.log('Updated chat messages before API call:', updatedChat.messages);
      const apiMessages = formatMessagesForAPI(updatedChat.messages);

      // Create assistant message
      const assistantMessageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      console.log('Generated assistantMessageId:', assistantMessageId);
      addMessage('assistant', '', assistantMessageId);
      
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
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onChatSelect={setActiveChat}
        onNewChat={addChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onThemeToggle={handleThemeToggle}
      />
      
      <div className="chat-container">
        <ChatHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          selectedImageModel={selectedImageModel}
          onImageModelChange={handleImageModelChange}
          sidebarOpen={sidebarOpen}
          models={models}
          imageModels={imageModels}
          modelsLoaded={modelsLoaded}
          mode={mode}
        />
        
        <MessageArea 
          messages={getActiveChat()?.messages || []} 
          isGenerating={isGenerating} 
          onRegenerate={handleRegenerateMessage}
        />
        
        <ChatInput
          onSend={handleSendMessage}
          isGenerating={isGenerating}
          onStop={handleStopGeneration}
          onGenerateImage={handleGenerateImage}
          setIsUserTyping={() => {}}
          onModeChange={setMode}
        />
      </div>

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={confirmModal.isDangerous}
      />
    </div>
  );
}

export default App;
