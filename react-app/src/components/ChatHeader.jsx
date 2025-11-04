import React, { useState, useRef, useEffect } from 'react';
import { MODELS } from '../utils/api';
import './ChatHeader.css';

const ChatHeader = ({ 
  onMenuToggle, 
  selectedModel, 
  onModelChange,
  sidebarOpen
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="chat-header">
      <div className="header-left">
        <button className={`header-icon-btn menu-toggle ${sidebarOpen ? 'open' : ''}`} onClick={onMenuToggle}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>
      
      <div className="header-center">
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
      </div>
    </header>
  );
};

export default ChatHeader;
