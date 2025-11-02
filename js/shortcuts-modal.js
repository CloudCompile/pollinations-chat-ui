// shortcuts-modal.js - Keyboard shortcuts modal component

const ShortcutsModal = {
  // State variables
  isOpen: false,

  // Initialize the shortcuts modal
  init() {
    this.createModal();
    this.setupEventListeners();
  },

  // Create the modal HTML and inject it into the DOM
  createModal() {
    const modalHTML = `
      <div id="shortcutsModal" class="shortcuts-modal-overlay hidden">
        <div class="shortcuts-modal">
          <div class="shortcuts-modal-header">
            <h2>Keyboard Shortcuts</h2>
            <button class="close-btn" id="closeShortcutsModalBtn" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="shortcuts-modal-content">
            <ul class="shortcuts-list" id="shortcutsList">
              <!-- Shortcuts will be populated dynamically -->
            </ul>
          </div>
        </div>
      </div>
    `;

    // Insert the modal into the body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Populate shortcuts
    this.populateShortcuts();
  },

  // Populate shortcuts list
  populateShortcuts() {
    const shortcuts = [
      { key: 'Cmd/Ctrl + K', description: 'Focus message input' },
      { key: 'Cmd/Ctrl + N', description: 'New chat' },
      { key: 'Cmd/Ctrl + B', description: 'Toggle sidebar' },
      { key: 'Ctrl + Shift + L', description: 'Toggle dark mode' },
      { key: 'Enter', description: 'Send message' },
      { key: 'Shift + Enter', description: 'New line' },
      { key: 'Escape', description: 'Close modal' }
    ];

    const shortcutsList = document.getElementById('shortcutsList');
    if (!shortcutsList) return;

    shortcutsList.innerHTML = '';
    shortcuts.forEach(shortcut => {
      const li = document.createElement('li');
      li.className = 'shortcut-item';
      li.innerHTML = `
        <kbd class="shortcut-key">${shortcut.key}</kbd>
        <span class="shortcut-description">${shortcut.description}</span>
      `;
      shortcutsList.appendChild(li);
    });
  },

  // Setup event listeners
  setupEventListeners() {
    const modal = document.getElementById('shortcutsModal');
    if (!modal) return;

    // Close button
    const closeBtn = document.getElementById('closeShortcutsModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },

  // Show the shortcuts modal
  show() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      this.isOpen = true;
    }
  },

  // Close the shortcuts modal
  close() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      this.isOpen = false;
    }
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ShortcutsModal.init());
} else {
  ShortcutsModal.init();
}

// Export for global access
window.ShortcutsModal = ShortcutsModal;