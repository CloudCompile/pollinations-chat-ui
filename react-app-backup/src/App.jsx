import { useState, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { sendMessage, stopGeneration, formatMessagesForAPI } from './utils/api';
import { getSelectedModel, saveSelectedModel, getTheme, saveTheme, getAccentColor, saveAccentColor } from './utils/storage';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageArea from './components/MessageArea';
import ChatInput from './components/ChatInput';
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
    removeMessagesAfter
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai');
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('gradient');

  useEffect(() => {
    const savedModel = getSelectedModel();
    const savedTheme = getTheme();
    const savedAccent = getAccentColor();
    setSelectedModel(savedModel);
    setTheme(savedTheme);
    setAccentColor(savedAccent);
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-accent', savedAccent);
  }, []);

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
          onAccentChange={handleAccentChange}
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
    </div>
  );
}

export default App;
