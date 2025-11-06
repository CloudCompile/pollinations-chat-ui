import React, { useState, useRef, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import './ChatInput.css';

const ChatInput = ({ onSend, isGenerating, onStop }) => {
const ChatInput = ({ onSend, isGenerating, onStop, setIsUserTyping, onGenerateImage, onModeChange }) => {
const ChatInput = ({ onSend, isGenerating, onStop, setIsUserTyping, onGenerateImage }) => {
  const [inputValue, setInputValue] = useState('');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const fileInputRef = useRef(null);
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

  // Close attach menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (inputValue.trim() && !isListening) {
      // Check if it's an image generation request
      if (inputValue.trim().startsWith('/imagine ')) {
        const prompt = inputValue.trim().substring(9); // Remove '/imagine '
        if (prompt && onGenerateImage) {
          onGenerateImage(prompt);
          setInputValue('');
          setIsUserTyping(false);
          return;
        }
      }
      
      onSend(inputValue);
      setInputValue('');
      setIsUserTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    setIsUserTyping(true);
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setIsAttachMenuOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement file upload logic
      console.log('File selected:', file);
    }
  };

  const handleImageGen = () => {
    setInputValue('/imagine ');
    setIsAttachMenuOpen(false);
    inputRef.current?.focus();
  };

  const handleCanvas = () => {
    setInputValue('/code ');
    setIsAttachMenuOpen(false);
    inputRef.current?.focus();
  };

  return (
    <footer className="chat-input-container">
      <div className="chat-input-wrapper-modern">
        <div className="attach-menu-wrapper" ref={attachMenuRef}>
          <button 
            className="input-icon-btn" 
            onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
            title="Attach"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          {isAttachMenuOpen && (
            <div className="attach-menu">
              <button className="attach-menu-item" onClick={handleFileUpload}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
                <span>Upload File</span>
              </button>
              <button className="attach-menu-item" onClick={handleImageGen}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span>Image Generation</span>
              </button>
              <button className="attach-menu-item" onClick={handleCanvas}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8"/>
                </svg>
                <span>Canvas (Code)</span>
              </button>
            </div>
          )}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        <textarea
          ref={inputRef}
          id="messageInput"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsUserTyping(e.target.value.length > 0);
            if (onModeChange) {
              if (e.target.value.includes('/imagine')) {
                onModeChange('imagine');
              } else {
                onModeChange('chat');
              }
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Write or code"
          rows="1"
          className="chat-input-modern"
          disabled={isGenerating || isListening}
        />
        {hasSpeechRecognition && (
          <button
            className={`input-icon-btn ${isListening ? 'listening' : ''}`}
            onClick={handleMicClick}
            disabled={isGenerating}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          </button>
        )}
        {isGenerating ? (
          <button className="send-btn-modern stop-btn" onClick={onStop} title="Stop generation">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <rect x="8" y="8" width="8" height="8" fill="white" rx="1"/>
            </svg>
          </button>
        ) : (
          <button 
            className="send-btn-modern" 
            onClick={handleSend} 
            disabled={!inputValue.trim()}
            title="Send message"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <path d="M10 8l6 4-6 4V8z" fill="white"/>
            </svg>
          </button>
        )}
      </div>
    </footer>
  );
};

}
export default ChatInput;
