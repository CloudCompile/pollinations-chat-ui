import { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { sendMessage, stopGeneration, formatMessagesForAPI, loadModels } from './utils/api';
import { getSelectedModel, saveSelectedModel, getTheme, saveTheme, getAccentColor, saveAccentColor } from './utils/storage';
import { useToast } from './components/ToastProvider';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageArea from './components/MessageArea';
import ChatInput from './components/ChatInput';
import ThemesModal from './components/ThemesModal';
import ShortcutsModal from './components/ShortcutsModal';
import CanvasCodeGenerator from './components/CanvasCodeGenerator';
import ConfirmationModal from './components/ConfirmationModal';
import './App.css';

function App() {
  const { showToast } = useToast();
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
    removeMessagesAfter
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai');
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('gradient');
  const [themesModalOpen, setThemesModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [canvasCodeGeneratorOpen, setCanvasCodeGeneratorOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [textModels, setTextModels] = useState([]);
  const [imageModels, setImageModels] = useState([]);

  useEffect(() => {
    const savedModel = getSelectedModel();
    const savedTheme = getTheme();
    const savedAccent = getAccentColor();
    setSelectedModel(savedModel);
    setTheme(savedTheme);
    setAccentColor(savedAccent);
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-accent', savedAccent);
    
    // Load models from API
    loadModels().then(({ textModels, imageModels }) => {
      setTextModels(textModels);
      setImageModels(imageModels);
      if (textModels.length > 0 || imageModels.length > 0) {
        showToast('Models loaded successfully!', 'success');
      } else {
        showToast('No models available. Using default model.', 'warning');
      }
    }).catch(error => {
      console.error('Error loading models:', error);
      showToast(`Error loading models: ${error.message}`, 'error');
    });
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if we're in an input field
      const isInputField = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      // Cmd/Ctrl + K - Open command palette (if implemented)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInputField) {
        e.preventDefault();
        // Command palette implementation would go here
      }
      
      // Cmd/Ctrl + N - New chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        addChat();
      }
      
      // Cmd/Ctrl + B - Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      // Shift + L - Toggle light/dark theme
      if (e.shiftKey && e.key === 'L') {
        e.preventDefault();
        handleThemeToggle();
      }
      
      // Escape - Stop generation or close modals
      if (e.key === 'Escape') {
        if (isGenerating) {
          handleStopGeneration();
        } else if (themesModalOpen) {
          setThemesModalOpen(false);
        } else if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
        } else if (sidebarOpen) {
          setSidebarOpen(false);
        }
      }
      
      // Cmd/Ctrl + / - Show shortcuts modal
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, themesModalOpen, shortcutsModalOpen, sidebarOpen, addChat, handleThemeToggle]);

  const handleModelChange = (model) => {
    setSelectedModel(model);
    saveSelectedModel(model);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    saveTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleAccentChange = (accent) => {
    setAccentColor(accent);
    saveAccentColor(accent);
    document.documentElement.setAttribute('data-accent', accent);
  };

  const handleSendMessage = async (content, imagePreview = null) => {
    if ((!content.trim() && !imagePreview) || isGenerating) return;

    // Add user message with image if provided
    const messageContent = imagePreview ? { text: content, image: imagePreview } : content;
    addMessage('user', messageContent);

    // Set generating state
    setIsGenerating(true);

    const activeChat = getActiveChat();
    if (!activeChat) return;

    // Prepare messages for API
    const messages = formatMessagesForAPI([...activeChat.messages, {
      role: 'user',
      content: messageContent
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
          showToast('Message sent successfully!', 'success');
        },
        // onError
        (error) => {
          updateMessage(assistantMessageId, {
            content: `❌ Sorry, there was an error: ${error.message}`,
            isStreaming: false,
            isError: true
          });
          setIsGenerating(false);
          showToast(`Error: ${error.message}`, 'error');
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setIsGenerating(false);
      showToast(`Error sending message: ${error.message}`, 'error');
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
          showToast('Message regenerated successfully!', 'success');
        },
        (error) => {
          updateMessage(assistantMessageId, {
            content: `❌ Sorry, there was an error: ${error.message}`,
            isStreaming: false,
            isError: true
          });
          setIsGenerating(false);
          showToast(`Error regenerating message: ${error.message}`, 'error');
        }
      );
    }, 100);
  };

  const handleImageUpload = (imageData) => {
    // This function is called when an image is uploaded
    // The image data is already converted to base64 in ChatInput
    console.log('Image uploaded:', imageData);
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
        onConfirmDeleteChat={confirmDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="chat-container">
        <ChatHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onThemeToggle={handleThemeToggle}
          onAccentChange={handleAccentChange}
          onOpenThemesModal={() => setThemesModalOpen(true)}
          onOpenCanvasCodeGenerator={() => setCanvasCodeGeneratorOpen(true)}
          textModels={textModels}
          imageModels={imageModels}
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
          onImageUpload={handleImageUpload}
        />
        
        <ThemesModal
          isOpen={themesModalOpen}
          onClose={() => setThemesModalOpen(false)}
          currentTheme={theme}
          currentAccent={accentColor}
          onThemeChange={(newTheme) => {
            setTheme(newTheme);
            saveTheme(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            setThemesModalOpen(false);
          }}
          onAccentChange={(newAccent) => {
            setAccentColor(newAccent);
            saveAccentColor(newAccent);
            document.documentElement.setAttribute('data-accent', newAccent);
            setThemesModalOpen(false);
          }}
        />
        
        <ShortcutsModal
          isOpen={shortcutsModalOpen}
          onClose={() => setShortcutsModalOpen(false)}
        />
        
        <CanvasCodeGenerator
          isOpen={canvasCodeGeneratorOpen}
          onClose={() => setCanvasCodeGeneratorOpen(false)}
          onCodeGenerated={(code) => {
            // Add the generated code as a message
            addMessage('user', `Here's the generated code:\n\n${code}`);
            setCanvasCodeGeneratorOpen(false);
          }}
        />
        
        <ConfirmationModal
          isOpen={confirmationModalOpen}
          onClose={() => setConfirmationModalOpen(false)}
          onConfirm={confirmationConfig.onConfirm}
          title={confirmationConfig.title}
          message={confirmationConfig.message}
        />
      </div>
    </div>
  );
}

export default App;
