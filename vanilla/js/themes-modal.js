// themes-modal.js - Themes modal component

const ThemesModal = {
  // State variables
  isOpen: false,
  currentTheme: 'dark',
  currentAccent: 'gradient',

  // Initialize the themes modal
  init() {
    this.createModal();
    this.setupEventListeners();
    this.loadPreferences();
  },

  // Create the modal HTML and inject it into the DOM
  createModal() {
    const modalHTML = `
      <div id="themesModal" class="themes-modal hidden">
        <div class="themes-modal-content">
          <div class="themes-modal-header">
            <h2>Appearance</h2>
            <button class="close-modal-btn" id="closeThemesModalBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="themes-modal-body">
            <div class="theme-section">
              <h3>Theme</h3>
              <p class="theme-section-desc">Choose between light and dark mode</p>
              <div class="theme-grid" id="themeGrid">
                <!-- Themes will be populated dynamically -->
              </div>
            </div>
            
            <div class="theme-section">
              <h3>Accent Color</h3>
              <p class="theme-section-desc">Choose your favorite accent color</p>
              <div class="theme-grid" id="accentGrid">
                <!-- Accents will be populated dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert the modal into the body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Populate themes and accents
    this.populateThemes();
    this.populateAccents();
  },

  // Populate themes grid
  populateThemes() {
    const themes = [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' }
    ];

    const themeGrid = document.getElementById('themeGrid');
    if (!themeGrid) return;

    themeGrid.innerHTML = '';
    themes.forEach(theme => {
      const themeCard = document.createElement('div');
      themeCard.className = `theme-card ${this.currentTheme === theme.id ? 'active' : ''}`;
      themeCard.setAttribute('data-theme', theme.id);
      
      themeCard.innerHTML = `
        <div class="theme-card-preview theme-${theme.id}">
          ${theme.id === 'dark' ? 
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' :
            '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
          }
        </div>
        <span class="theme-card-label">${theme.name}</span>
      `;
      
      themeGrid.appendChild(themeCard);
    });
  },

  // Populate accents grid
  populateAccents() {
    const accents = [
      { id: 'gradient', name: 'Gradient', previewClass: 'accent-gradient' },
      { id: 'blue', name: 'Blue', previewClass: 'accent-blue' },
      { id: 'red', name: 'Red', previewClass: 'accent-red' },
      { id: 'green', name: 'Green', previewClass: 'accent-green' },
      { id: 'purple', name: 'Purple', previewClass: 'accent-purple' },
      { id: 'orange', name: 'Orange', previewClass: 'accent-orange' }
    ];

    const accentGrid = document.getElementById('accentGrid');
    if (!accentGrid) return;

    accentGrid.innerHTML = '';
    accents.forEach(accent => {
      const accentCard = document.createElement('div');
      accentCard.className = `theme-card ${this.currentAccent === accent.id ? 'active' : ''}`;
      accentCard.setAttribute('data-accent', accent.id);
      
      accentCard.innerHTML = `
        <div class="theme-card-preview ${accent.previewClass}">
          <div class="accent-preview-inner"></div>
        </div>
        <span class="theme-card-label">${accent.name}</span>
      `;
      
      accentGrid.appendChild(accentCard);
    });
  },

  // Setup event listeners
  setupEventListeners() {
    const modal = document.getElementById('themesModal');
    if (!modal) return;

    // Close button
    const closeBtn = document.getElementById('closeThemesModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });

    // Theme selection
    const themeGrid = document.getElementById('themeGrid');
    if (themeGrid) {
      themeGrid.addEventListener('click', (e) => {
        const themeCard = e.target.closest('.theme-card');
        if (themeCard) {
          const themeId = themeCard.getAttribute('data-theme');
          if (themeId) {
            this.setTheme(themeId);
          }
        }
      });
    }

    // Accent selection
    const accentGrid = document.getElementById('accentGrid');
    if (accentGrid) {
      accentGrid.addEventListener('click', (e) => {
        const accentCard = e.target.closest('.theme-card');
        if (accentCard) {
          const accentId = accentCard.getAttribute('data-accent');
          if (accentId) {
            this.setAccent(accentId);
          }
        }
      });
    }

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },

  // Load theme and accent preferences
  loadPreferences() {
    // Load theme preference
    const savedTheme = window.Storage ? window.Storage.getTheme() : null;
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }

    // Load accent preference
    const savedAccent = window.Storage ? window.Storage.getAccentColor() : null;
    if (savedAccent) {
      this.currentAccent = savedAccent;
    }
  },

  // Show the themes modal
  show() {
    const modal = document.getElementById('themesModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      this.isOpen = true;
      
      // Refresh the UI to reflect current settings
      this.populateThemes();
      this.populateAccents();
    }
  },

  // Close the themes modal
  close() {
    const modal = document.getElementById('themesModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      this.isOpen = false;
    }
  },

  // Set theme
  setTheme(themeId) {
    this.currentTheme = themeId;
    
    // Apply theme
    if (window.App) {
      window.App.applyTheme(themeId);
    } else {
      // Fallback implementation
      if (themeId === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
    
    // Update UI
    this.populateThemes();
    
    // Save preference
    if (window.Storage) {
      window.Storage.saveTheme(themeId);
    }
  },

  // Set accent color
  setAccent(accentId) {
    this.currentAccent = accentId;
    
    // Apply accent
    if (window.App) {
      window.App.setAccentColor(accentId);
    } else {
      // Fallback implementation
      document.body.setAttribute('data-accent', accentId);
    }
    
    // Update UI
    this.populateAccents();
    
    // Save preference
    if (window.Storage) {
      window.Storage.saveAccentColor(accentId);
    }
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemesModal.init());
} else {
  ThemesModal.init();
}

// Export for global access
window.ThemesModal = ThemesModal;