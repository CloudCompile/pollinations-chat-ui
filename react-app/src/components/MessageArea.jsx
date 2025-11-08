import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { formatMessage } from '../utils/markdown';
import './MessageArea.css';

const MessageArea = ({ messages, isGenerating, isUserTyping, onRegenerate }) => {
  const messagesEndRef = useRef(null);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [expandedErrors, setExpandedErrors] = useState({});

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Select a random welcome message when component mounts or messages become empty
    const welcomeMessages = [
      "What can I help with today?",
      "What's on your mind?",
      "How can I assist you?",
      "What are we creating today?",
      "Ask me anything.",
      "Ready to explore ideas?",
      "What would you like to know?",
      "Let's make something amazing!",
      "How may I help you?",
      "What brings you here today?"
    ];
    setWelcomeMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
  }, [messages.length]);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        if (window?.showToast) window.showToast("Copied to clipboard!", "info");
      })
      .catch((err) => {
        if (window?.showToast) window.showToast("Failed to copy: " + err.message, "error");
      });
  }, []);

  const toggleErrorDetails = useCallback((messageId) => {
    setExpandedErrors(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  }, []);

  if (messages.length === 0 && !isGenerating) {
    return (
      <main className="messages-area">
        <div className="welcome-screen">
          <h1 className="welcome-text" key={welcomeMessage}>{welcomeMessage}</h1>
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
                <img src="pollinations-logo.svg" alt="AI" className="ai-logo" />
              )}
            </div>
            
            <div className={`message-bubble ${message.role} ${message.isStreaming ? 'streaming' : ''} ${message.isError ? 'error' : ''}`}>
              {/* Display image if present */}
              {message.imageUrl && (
                <div className="message-image-container">
                  <img
                    src={message.imageUrl}
                    alt={message.imagePrompt || 'Generated image'}
                    className="message-image"
                    loading="lazy"
                  />
                  {message.imagePrompt && (
                    <div className="image-prompt">
                      <strong>Prompt:</strong> {message.imagePrompt}
                    </div>
                  )}
                  {message.imageModel && (
                    <div className="image-model">
                      <strong>Model:</strong> {message.imageModel}
                    </div>
                  )}
                </div>
              )}
              
              {/* Display text content */}
              {message.role === 'assistant' ? (
                message.isError ? (
                  <div className="message-error">
                    <div className="error-header">
                      <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span className="error-title">An error occurred</span>
                    </div>
                    <button 
                      className="error-toggle"
                      onClick={() => toggleErrorDetails(message.id || message.timestamp)}
                    >
                      {expandedErrors[message.id || message.timestamp] ? 'Hide details' : 'See details'}
                      <svg 
                        className={`error-toggle-icon ${expandedErrors[message.id || message.timestamp] ? 'expanded' : ''}`}
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>
                    {expandedErrors[message.id || message.timestamp] && (
                      <div className="error-details">
                        {message.content}
                      </div>
                    )}
                  </div>
                ) : message.isStreaming ? (
                  <div className="message-content">
                    {message.content}
                  </div>
                ) : (
                  <div
                    className="message-content"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />
                )
              ) : (
                <div className="message-content">
                  {message.content ?? ''}
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
        
        {isGenerating && (messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant' || !messages[messages.length - 1]?.isStreaming) && (
          <div className="message-row assistant">
            <div className="message-avatar assistant">
              <img src="pollinations-logo.svg" alt="AI" className="ai-logo" />
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
        {isUserTyping && messages[messages.length - 1]?.role !== 'user' && (
          <div className="message-row user">
            <div className="message-avatar user">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="5"/>
                <path d="M20 21a8 8 0 00-16 0"/>
              </svg>
            </div>
            <div className="message-bubble user">
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
