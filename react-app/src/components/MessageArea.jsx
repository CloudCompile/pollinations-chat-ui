import React, { useEffect, useRef } from 'react';
import { formatMessage } from '../utils/markdown';
import './MessageArea.css';

const MessageArea = ({ messages, isGenerating, onRegenerate }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const welcomeMessages = [
    "What's on your mind today?",
    "What's on the agenda today?",
    "How can I help you today?",
    "What would you like to create?",
    "Ready to explore new ideas?"
  ];

  const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

  if (messages.length === 0 && !isGenerating) {
    return (
      <main className="messages-area">
        <div className="welcome-screen">
          <div className="welcome-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="welcome-title">pollinations.ai</h1>
          <p className="welcome-subtitle">{randomWelcome}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="messages-area">
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message-row ${message.role}`}>
            <div className={`message-avatar ${message.role}`}>
              {message.role === 'user' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="5"/>
                  <path d="M20 21a8 8 0 00-16 0"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              )}
            </div>
            
            <div className={`message-bubble ${message.role} ${message.isStreaming ? 'streaming' : ''} ${message.isError ? 'error' : ''}`}>
              {message.role === 'assistant' ? (
                <div 
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
              ) : (
                <div className="message-content">
                  {message.content}
                </div>
              )}
              <div className="message-timestamp">
                {formatTime(message.timestamp)}
              </div>
              
              {/* Action buttons for assistant messages */}
              {message.role === 'assistant' && !message.isStreaming && (
                <div className="message-actions">
                  <button
                    className="message-action-btn"
                    onClick={() => copyToClipboard(message.content)}
                    title="Copy message"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                  <button
                    className="message-action-btn"
                    onClick={() => !isGenerating && onRegenerate()}
                    title="Regenerate response"
                    disabled={isGenerating}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="message-row assistant">
            <div className="message-avatar assistant">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="message-bubble assistant">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
};

export default MessageArea;
