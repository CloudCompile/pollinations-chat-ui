import React, { useState, useRef, useEffect } from 'react';
import './ChatHeader.css';

const ChatHeader = ({ onMenuToggle, selectedModel, onModelChange, onThemeToggle, onAccentChange, onOpenThemesModal, onOpenCanvasCodeGenerator, textModels, imageModels }) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAccentDropdownOpen, setIsAccentDropdownOpen] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState('');
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

  // Find the currently selected model
  const getCurrentModel = () => {
    const allModels = [...(textModels || []), ...(imageModels || [])];
    return allModels.find(m => m.id === selectedModel) || { name: 'Select Model' };
  };

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
            <span>{getCurrentModel().name}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isModelDropdownOpen && (
            <div className="model-dropdown">
              <div className="model-search-container">
                <input
                  type="text"
                  placeholder="Search models..."
                  value={modelSearchTerm}
                  onChange={(e) => setModelSearchTerm(e.target.value)}
                  className="model-search-input"
                />
              </div>
              {textModels && textModels.length > 0 && (
                <div className="model-group">
                  <div className="model-group-label">💬 Text Models</div>
                  {textModels
                    .filter(model =>
                      model.name.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
                      (model.id && model.id.toLowerCase().includes(modelSearchTerm.toLowerCase()))
                    )
                    .map(model => (
                      <button
                        key={model.id}
                        className={`model-option ${selectedModel === model.id ? 'active' : ''}`}
                        onClick={() => {
                          onModelChange(model.id);
                          setIsModelDropdownOpen(false);
                          setModelSearchTerm('');
                        }}
                      >
                        {model.name}
                        {model.supportsVision && (
                          <span className="model-vision-badge" title="Supports image input">
                            👁️
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              )}
              {imageModels && imageModels.length > 0 && (
                <div className="model-group">
                  <div className="model-group-label">🖼️ Image Models</div>
                  {imageModels
                    .filter(model =>
                      model.name.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
                      (model.id && model.id.toLowerCase().includes(modelSearchTerm.toLowerCase()))
                    )
                    .map(model => (
                      <button
                        key={model.id}
                        className={`model-option ${selectedModel === model.id ? 'active' : ''}`}
                        onClick={() => {
                          onModelChange(model.id);
                          setIsModelDropdownOpen(false);
                          setModelSearchTerm('');
                        }}
                      >
                        {model.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="header-right">
        <button className="header-icon-btn" onClick={onOpenCanvasCodeGenerator} title="Canvas Code Generator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M18 18V7a2 2 0 00-2-2H7" />
            <path d="M14 3v4a2 2 0 002 2h4" />
          </svg>
        </button>
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
        <button className="header-icon-btn" onClick={onOpenThemesModal} title="Customize Appearance">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m0-12a3 3 0 01-3-3M12 1a3 3 0 013-3m-3 3a3 3 0 00-3 3m6 0a3 3 0 013 3m-3-3a3 3 0 01-3 3m0 6a3 3 0 01-3 3m0 0a3 3 0 013 3m0-3a3 3 0 003-3m-3 3a3 3 0 01-3-3" />
          </svg>
        </button>
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
