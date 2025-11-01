import React, { useState, useRef, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import './ChatInput.css';

const ChatInput = ({ onSend, isGenerating, onStop }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const { isListening, startListening, stopListening, hasSpeechRecognition } = useSpeech();

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (isListening) {
      setInputValue('Listening...');
    } else if (inputValue === 'Listening...') {
      setInputValue('');
    }
  }, [isListening, inputValue]);

  const handleSend = () => {
    if (inputValue.trim() && !isListening) {
      onSend(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInputValue(transcript);
        // Automatically send after successful recognition
        onSend(transcript);
      });
    }
  };

  return (
    <footer className="chat-input-area">
      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write or code"
          rows="1"
          className="chat-input"
          disabled={isGenerating || isListening}
        />
        <div className="input-actions">
          {hasSpeechRecognition && (
            <button
              className={`input-action-btn mic-btn ${isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
              disabled={isGenerating}
              title={isListening ? 'Stop listening' : 'Use microphone'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            </button>
          )}
          {isGenerating ? (
            <button className="input-action-btn stop-btn" onClick={onStop} title="Stop generation">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button className="input-action-btn send-btn" onClick={handleSend} title="Send message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default ChatInput;
