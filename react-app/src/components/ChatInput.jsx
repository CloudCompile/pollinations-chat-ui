import React, { useState, useRef, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import './ChatInput.css';

const ChatInput = ({
  onSend,
  isGenerating,
  onStop,
  setIsUserTyping = () => {},
  onGenerateImage,
  onModeChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
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

  // Close attach menu when clicking outside the menu area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus input on mount and after sending
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (inputValue.trim() && !isListening) {
      if (inputValue.trim().startsWith('/imagine ')) {
        const prompt = inputValue.trim().substring(9);
        if (prompt && onGenerateImage) {
          onGenerateImage(prompt);
          setInputValue('');
          setIsUserTyping(false);
          // Reset to chat mode after sending
          if (onModeChange) {
            onModeChange('chat');
          }
          // Refocus input after sending
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }
      }

      onSend(inputValue);
      setInputValue('');
      setIsUserTyping(false);
      // Reset to chat mode after sending
      if (onModeChange) {
        onModeChange('chat');
      }
      // Refocus input after sending
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
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
        setIsUserTyping(false);
        onSend(transcript);
      });
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setIsAttachMenuOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage({
          file: file,
          preview: e.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageGen = () => {
    setInputValue('/imagine ');
    setIsAttachMenuOpen(false);
    if (onModeChange) {
      onModeChange('imagine');
    }
    inputRef.current?.focus();
  };

  const handleCanvas = () => {
    setInputValue('/code ');
    setIsAttachMenuOpen(false);
    if (onModeChange) {
      onModeChange('code');
    }
    inputRef.current?.focus();
  };

  return (
    <footer className="chat-input-container">
      <div className="chat-input-inner">
        {/* Image Preview Above Input */}
        {selectedImage && (
          <div className="image-preview-above">
            <div className="image-preview-wrapper">
              <img src={selectedImage.preview} alt="Preview" className="image-preview-large" />
              <button className="image-preview-remove-large" onClick={removeSelectedImage} title="Remove image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div className="image-preview-name">{selectedImage.name}</div>
            </div>
          </div>
        )}
        
        <div className="chat-input-wrapper-modern">
        <div className="attach-menu-wrapper" ref={attachMenuRef}>
          <button
            className="input-icon-btn"
            onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
            title="Attach"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          {isAttachMenuOpen && (
            <div className="attach-menu">
              <button className="attach-menu-item" onClick={handleFileUpload}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                <span>Upload File</span>
              </button>
              <button className="attach-menu-item" onClick={handleImageGen}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span>Image Generation</span>
              </button>
              <button className="attach-menu-item" onClick={handleCanvas}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" />
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
        
        {/* Image Mode Tag */}
        {inputValue.includes('/imagine') && (
          <div className="image-mode-tag">
            <svg className="image-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            <span>Image</span>
          </div>
        )}
        
        {/* Canvas/Code Mode Tag */}
        {inputValue.includes('/code') && (
          <div className="canvas-mode-tag">
            <svg className="canvas-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8"/>
            </svg>
            <span>Canvas</span>
          </div>
        )}
        
        <textarea
          ref={inputRef}
          id="messageInput"
          value={
            inputValue.includes('/imagine') 
              ? inputValue.replace('/imagine ', '').replace('/imagine', '') 
              : inputValue.includes('/code')
                ? inputValue.replace('/code ', '').replace('/code', '')
                : inputValue
          }
          onChange={(event) => {
            const value = event.target.value;
            // If in imagine mode, prepend /imagine to the actual value
            if (inputValue.includes('/imagine')) {
              setInputValue('/imagine ' + value);
            } else if (inputValue.includes('/code')) {
              setInputValue('/code ' + value);
            } else {
              setInputValue(value);
            }
            setIsUserTyping(value.length > 0);
            if (onModeChange) {
              if (inputValue.includes('/imagine')) {
                onModeChange('imagine');
              } else if (inputValue.includes('/code')) {
                onModeChange('code');
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
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </button>
        )}
        {isGenerating ? (
          <button className="send-btn-modern stop-btn" onClick={onStop} title="Stop generation">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
              <rect x="8" y="8" width="8" height="8" fill="white" rx="1" />
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
              <circle cx="12" cy="12" r="10" />
              <path d="M10 8l6 4-6 4V8z" fill="white" />
            </svg>
          </button>
        )}
      </div>
      </div>
    </footer>
  );
};

export default ChatInput;
