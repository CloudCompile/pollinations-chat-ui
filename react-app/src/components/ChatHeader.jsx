import React, { useState, useRef, useEffect } from 'react';
import { MODELS } from '../utils/api';
import './ChatHeader.css';

const ChatHeader = ({ 
  onMenuToggle, 
  selectedModel, 
  onModelChange, 
  onThemeToggle, 
  onThemesClick,
  onKeyboardShortcutsClick,
  onExportChat,
  onClearAll
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="chat-header">
      <div className="header-left">
        <button className="header-icon-btn" onClick={onMenuToggle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <div className="model-selector-wrapper" ref={modelDropdownRef}>
          <button className="model-selector" onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}>
            <span id="currentModelName">{MODELS[selectedModel]?.name || 'Select Model'}</span>
            <svg className="model-selector-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {isModelDropdownOpen && (
            <div className="model-dropdown">
              <div className="model-dropdown-search">
                <input type="text" placeholder="Search models..." />
              </div>
              <div className="model-list">
                {Object.entries(MODELS).map(([key, model]) => (
                  <button
                    key={key}
                    className={`model-option ${selectedModel === key ? 'active' : ''}`}
                    onClick={() => {
                      onModelChange(key);
                      setIsModelDropdownOpen(false);
                    }}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="header-right">
        <button className="header-icon-btn" onClick={onThemesClick} title="Themes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
        </button>
        <button className="header-icon-btn" onClick={onThemeToggle} title="Toggle theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        </button>
        <div className="user-profile-wrapper" ref={userDropdownRef}>
          <button 
            className="header-icon-btn user-profile" 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            title="Profile"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5"/>
              <path d="M20 21a8 8 0 00-16 0"/>
            </svg>
          </button>
          {isUserDropdownOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">User Menu</div>
              <button className="user-dropdown-item" onClick={() => {
                onKeyboardShortcutsClick();
                setIsUserDropdownOpen(false);
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M6 8h.01M10 8h.01M14 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01"/>
                </svg>
                <span>Keyboard Shortcuts</span>
              </button>
              <button className="user-dropdown-item" onClick={() => {
                onExportChat();
                setIsUserDropdownOpen(false);
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span>Export Chat</span>
              </button>
              <button className="user-dropdown-item" onClick={() => {
                onClearAll();
                setIsUserDropdownOpen(false);
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                <span>Clear All Chats</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
