// app.js - Main application initialization and coordination

const App = {
  // Initialize the application
  init() {
    console.log('Initializing Pollinations Chat UI...');
    
    // Load theme preference
    this.loadTheme();
    
    // Initialize modules
    window.Chat.init();
    
    // Setup global event listeners
    this.setupEventListeners();
    
    console.log('App initialized successfully!');
  },

  // Load theme from storage
  loadTheme() {
    const theme = window.Storage.getTheme();
    this.applyTheme(theme);
  },

  // Apply theme
  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    window.Storage.saveTheme(theme);
  },

  // Toggle theme
  toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    this.applyTheme(isDark ? 'light' : 'dark');
  },

  // Setup global event listeners
  setupEventListeners() {
    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        window.Chat.addChat();
      });
    }

    // Sidebar toggle (mobile)
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Attach menu toggle
    const attachBtn = document.getElementById('attachBtn');
    const attachMenu = document.getElementById('attachMenu');
    if (attachBtn && attachMenu) {
      attachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        attachMenu.classList.toggle('hidden');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!attachMenu.contains(e.target) && !attachBtn.contains(e.target)) {
          attachMenu.classList.add('hidden');
        }
      });

      // Handle menu items
      document.getElementById('fileUploadBtn')?.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        window.UI.showToast('File upload feature coming soon!');
      });

      document.getElementById('imageGenBtn')?.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        window.UI.showToast('Image generation feature coming soon!');
      });

      document.getElementById('canvasBtn')?.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        window.UI.showToast('Canvas code generation coming soon!');
      });
    }

    // Model selector
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
      modelSelector.addEventListener('change', (e) => {
        const selectedModel = e.target.value;
        window.UI.showToast(`Switched to ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Focus message input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const messageInput = document.getElementById('messageInput');
        if (messageInput) messageInput.focus();
      }

      // Cmd/Ctrl + N: New chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        window.Chat.addChat();
      }

      // Cmd/Ctrl + B: Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('collapsed');
      }

      // Cmd/Ctrl + Shift + L: Toggle theme
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menuBtn');
        
        if (sidebar && menuBtn && 
            !sidebar.contains(e.target) && 
            !menuBtn.contains(e.target) &&
            !sidebar.classList.contains('collapsed')) {
          sidebar.classList.add('collapsed');
        }
      }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Ensure sidebar is visible on desktop
        if (window.innerWidth > 768) {
          const sidebar = document.getElementById('sidebar');
          if (sidebar) sidebar.classList.remove('collapsed');
        }
      }, 250);
    });
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Export for global access
window.App = App;
