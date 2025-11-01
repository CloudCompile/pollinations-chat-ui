import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import VirtualizedMessageList from './VirtualizedMessageList';
import './MessageArea.css';

const MessageArea = ({ messages, isGenerating, onRegenerate }) => {
  const welcomeMessages = [
    "What's on the agenda today?",
    "How can I help you today?",
    "What would you like to create?",
    "Ready to explore new ideas?",
    "Let's build something amazing!"
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
        <VirtualizedMessageList
          messages={messages}
          isGenerating={isGenerating}
          onRegenerate={onRegenerate}
        />
        
        {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="message-row assistant">
            <div className="message-avatar assistant">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="message-bubble assistant">
              <LoadingSpinner size="small" />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default MessageArea;
