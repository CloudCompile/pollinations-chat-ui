import React from 'react';
import './ThemesModal.css';

const ThemesModal = ({ isOpen, onClose, currentTheme, currentAccent, onThemeChange, onAccentChange }) => {
  const themes = [
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' }
  ];

  const accents = [
    { id: 'gradient', name: 'Gradient', previewClass: 'accent-gradient' },
    { id: 'blue', name: 'Blue', previewClass: 'accent-blue' },
    { id: 'red', name: 'Red', previewClass: 'accent-red' },
    { id: 'green', name: 'Green', previewClass: 'accent-green' },
    { id: 'purple', name: 'Purple', previewClass: 'accent-purple' },
    { id: 'orange', name: 'Orange', previewClass: 'accent-orange' }
  ];

  if (!isOpen) return null;

  return (
    <div className="themes-modal" onClick={onClose}>
      <div className="themes-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="themes-modal-header">
          <h2>Appearance</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="themes-modal-body">
          <div className="theme-section">
            <h3>Theme</h3>
            <p className="theme-section-desc">Choose between light and dark mode</p>
            <div className="theme-grid">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`theme-card ${currentTheme === theme.id ? 'active' : ''}`}
                  onClick={() => onThemeChange(theme.id)}
                >
                  <div className={`theme-card-preview theme-${theme.id}`}>
                    {theme.id === 'dark' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                    )}
                  </div>
                  <span className="theme-card-label">{theme.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="theme-section">
            <h3>Accent Color</h3>
            <p className="theme-section-desc">Choose your favorite accent color</p>
            <div className="theme-grid">
              {accents.map((accent) => (
                <div
                  key={accent.id}
                  className={`theme-card ${currentAccent === accent.id ? 'active' : ''}`}
                  onClick={() => onAccentChange(accent.id)}
                >
                  <div className={`theme-card-preview ${accent.previewClass}`}>
                    <div className="accent-preview-inner"></div>
                  </div>
                  <span className="theme-card-label">{accent.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemesModal;