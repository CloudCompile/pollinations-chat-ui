import React, { useState, useRef, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import './ChatInput.css';

const ChatInput = ({ onSend, isGenerating, onStop, onImageUpload }) => {
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const {
    isListening,
    startListening,
    stopListening,
    hasSpeechRecognition,
    interimTranscript,
    isProcessing
  } = useSpeech();

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (isListening) {
      // Don't override user input with "Listening..." if they're typing
      if (!inputValue || inputValue === 'Listening...') {
        setInputValue('Listening...');
      }
    } else if (inputValue === 'Listening...') {
      setInputValue('');
    }
  }, [isListening, inputValue]);

  // Update input with interim results
  useEffect(() => {
    if (isListening && interimTranscript) {
      setInputValue(interimTranscript);
    }
  }, [isListening, interimTranscript]);

  const handleSend = () => {
    if ((inputValue.trim() || imagePreview) && !isListening && !isProcessing) {
      onSend(inputValue, imagePreview);
      setInputValue('');
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        setTimeout(() => {
          if (transcript.trim()) {
            onSend(transcript);
          }
        }, 100);
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        onImageUpload(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <footer className="chat-input-area">
      {imagePreview && (
        <div className="image-preview-container">
          <img src={imagePreview} alt="Preview" className="image-preview" />
          <button className="remove-image-btn" onClick={removeImage} title="Remove image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write or code"
          rows="1"
          className={`chat-input ${isListening ? 'listening' : ''}`}
          disabled={isGenerating || isProcessing}
        />
        <div className="input-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            className="input-action-btn attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            title="Attach image"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          {hasSpeechRecognition && (
            <button
              className={`input-action-btn mic-btn ${isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
              disabled={isGenerating || isProcessing}
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
            <button
              className="input-action-btn send-btn"
              onClick={handleSend}
              title="Send message"
              disabled={isProcessing}
            >
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
