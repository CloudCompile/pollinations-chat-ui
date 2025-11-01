import React, { useState, useRef, useEffect } from 'react';
import { MODELS } from '../utils/api';
import './ChatHeader.css';

const ChatHeader = ({ onMenuToggle, selectedModel, onModelChange, onThemeToggle, onAccentChange }) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAccentDropdownOpen, setIsAccentDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const accentDropdownRef = useRef(null);

  const ACCENT_COLORS = ['gradient', 'blue', 'green', 'red', 'purple', 'orange'];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
      if (accentDropdownRef.current && !accentDropdownRef.current.contains(event.target)) {
        setIsAccentDropdownOpen(false);
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
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="model-selector-container" ref={modelDropdownRef}>
          <button className="model-selector" onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}>
            <span>{MODELS[selectedModel]?.name || 'Select Model'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isModelDropdownOpen && (
            <div className="model-dropdown">
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
          )}
        </div>
      </div>
      <div className="header-right">
        <div className="accent-selector-container" ref={accentDropdownRef}>
          <button className="header-icon-btn" onClick={() => setIsAccentDropdownOpen(!isAccentDropdownOpen)} title="Change Accent Color">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.32 0L12 2.69z" />
              <path d="M12 22.31V12" />
            </svg>
          </button>
          {isAccentDropdownOpen && (
            <div className="accent-dropdown">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color}
                  className="accent-option"
                  style={{ background: `var(--accent-${color}, var(--c3))` }}
                  onClick={() => {
                    onAccentChange(color);
                    setIsAccentDropdownOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <button id="themeToggle" className="header-icon-btn" onClick={onThemeToggle} title="Toggle Theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
        <button className="header-icon-btn user-profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
