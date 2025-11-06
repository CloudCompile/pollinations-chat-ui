import React, { useState, useRef, useEffect } from 'react';
import './ChatHeader.css';

const ChatHeader = ({
  onMenuToggle,
  selectedModel,
  onModelChange,
  sidebarOpen
  selectedImageModel,
  onImageModelChange,
  sidebarOpen,
  models = {},
  imageModels = {},
  modelsLoaded = false,
  mode = 'chat'
  modelsLoaded = false

}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isImageModelDropdownOpen, setIsImageModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const imageModelDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
      if (imageModelDropdownRef.current && !imageModelDropdownRef.current.contains(event.target)) {
        setIsImageModelDropdownOpen(false);
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
  <span className="model-label">{mode === 'imagine' ? '🎨' : '💬'}</span>
  <span id="currentModelName">
    {mode === 'imagine'
      ? imageModels[selectedImageModel]?.name || 'Loading...'
      : models[selectedModel]?.name || 'Loading...'}
  </span>
            <svg className="model-selector-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {isModelDropdownOpen && (
            <div className="model-dropdown">
              <div className="model-dropdown-search">
                <input
                  type="text"
                  placeholder={mode === 'imagine' ? "Search image models..." : "Search text models..."}
                />
              </div>
              <div className="model-list">
                {(mode === 'imagine' ? Object.entries(imageModels) : Object.entries(models)).map(([key, model]) => (
                  <button
                    key={key}
                    className={`model-option ${
                      (mode === 'imagine' ? selectedImageModel : selectedModel) === key ? 'active' : ''
                    }`}
                    onClick={() => {
                      if (mode === 'imagine') {
                        onImageModelChange(key);
                      } else {
                        onModelChange(key);
                      }
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
        
        <div className="model-selector-wrapper" ref={imageModelDropdownRef}>
          <button className="model-selector" onClick={() => setIsImageModelDropdownOpen(!isImageModelDropdownOpen)}>
            <span className="model-label">🎨</span>
            <span id="currentImageModelName">{imageModels[selectedImageModel]?.name || 'Loading...'}</span>
            <svg className="model-selector-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {isImageModelDropdownOpen && (
            <div className="model-dropdown">
              <div className="model-dropdown-search">
                <input type="text" placeholder="Search image models..." />
              </div>
              <div className="model-list">
                {Object.entries(imageModels).map(([key, model]) => (
                  <button
                    key={key}
                    className={`model-option ${selectedImageModel === key ? 'active' : ''}`}
                    onClick={() => {
                      onImageModelChange(key);
                      setIsImageModelDropdownOpen(false);
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
