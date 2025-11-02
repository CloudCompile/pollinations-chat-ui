// app.js - Main application initialization and coordination

const App = {
  // Initialize the application
  async init() {
    console.log('Initializing Pollinations Chat UI...');

    // Load theme preference
    this.loadTheme();

    // Load accent color preference
    this.loadAccentColor();

    // Initialize API module
    if (window.API) {
      // --- Force Pollinations configuration ---
      try {
        window.API.baseText = "https://text.pollinations.ai/openai/";
        window.API.baseImage = "https://image.pollinations.ai/prompt/";
        window.API.apiKey = null;
        window.API.usePollinations = true;

        // Clear any old API keys or dummy flags in localStorage
        if (window.Storage) {
          localStorage.removeItem("apiKey");
          localStorage.removeItem("useDummyAPI");
        }

        await window.API.init?.();

        console.log("✅ Pollinations API initialized:", window.API.baseText);
      } catch (err) {
        console.error("❌ Pollinations API failed to initialize:", err);
      }
    }

    // Initialize Markdown module
    if (window.Markdown) {
      window.Markdown.init();
    }

    // Initialize Speech module
    if (window.Speech) {
      window.Speech.init();
    }

    // Initialize Chat module
    if (window.Chat) {
      window.Chat.init();
    }

    // Setup global event listeners
    this.setupEventListeners();

    console.log('App initialized successfully!');
  },

  // Load theme from storage
  loadTheme() {
    const theme = window.Storage.getTheme();
    this.applyTheme(theme);
  },

  // Load accent color from storage
  loadAccentColor() {
    const accent = window.Storage.getAccentColor() || 'gradient';
    this.setAccentColor(accent, true); // Silent mode for initial load
  },

  // Set accent color
  setAccentColor(accent, silent = false) {
    document.body.setAttribute('data-accent', accent);
    window.Storage.saveAccentColor(accent);
    if (!silent) {
      window.UI.showToast(`Accent color changed to ${accent}`);
    }
  },

  // Apply theme
  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    window.Storage.saveTheme(theme);
    this.updateThemeIcon();
  },

  // Update theme toggle icon
  updateThemeIcon() {
    const isDark = document.body.classList.contains('dark');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      // Update the SVG icon
      themeToggle.innerHTML = isDark
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="5"/>
             <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
           </svg>`;
    }
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

    // Sidebar close button
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    if (closeSidebarBtn && sidebar) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
      });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // User profile dropdown
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userProfileBtn && userDropdown) {
      userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
        // Close attach menu if open
        const attachMenu = document.getElementById('attachMenu');
        if (attachMenu) attachMenu.classList.add('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userDropdown.contains(e.target) && !userProfileBtn.contains(e.target)) {
          userDropdown.classList.add('hidden');
        }
      });

      // Handle accent color selection
      const accentSelectors = document.querySelectorAll('.accent-selector');
      accentSelectors.forEach(selector => {
        selector.addEventListener('click', (e) => {
          const accent = e.currentTarget.dataset.accent;
          this.setAccentColor(accent);
          userDropdown.classList.add('hidden');
        });
      });
    }

    // Attach menu toggle
    const attachBtn = document.getElementById('attachBtn');
    const attachMenu = document.getElementById('attachMenu');
    if (attachBtn && attachMenu) {
      attachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        attachMenu.classList.toggle('hidden');
        // Close user dropdown if open
        if (userDropdown) userDropdown.classList.add('hidden');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!attachMenu.contains(e.target) && !attachBtn.contains(e.target)) {
          attachMenu.classList.add('hidden');
        }
      });

      // Handle menu items
      // Handle image/file upload via hidden input
      const fileUploadBtn = document.getElementById('fileUploadBtn');
      const imageFileInput = document.getElementById('imageFileInput');

      fileUploadBtn?.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        // Trigger hidden file input
        if (imageFileInput) imageFileInput.click();
      });

      // When user selects a file, read it as data URL and add as a user message
      imageFileInput?.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        // Only allow images (extra guard)
        if (!file.type.startsWith('image/')) {
          window.UI.showToast('Please select an image file');
          imageFileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target.result;

          // Add an image message (user)
          if (window.Chat) {
            window.Chat.addMessage('user', {
              image: dataUrl,
              filename: file.name,
              size: file.size
            });
            window.UI.showToast('Image attached');
          }

          // Notify if current model cannot process images
          if (window.API) {
            const modelInfo = window.API.getCurrentModelInfo?.();
            if (!modelInfo || !modelInfo.supportsVision) {
              window.UI.showToast('Current model cannot see images. Switch to a model marked with 👁️.');
            }
          }

          // clear input so same file can be selected again later
          imageFileInput.value = '';
        };
        reader.readAsDataURL(file);
      });

      // Image generation handled below with mode switching

      document.getElementById('canvasBtn')?.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        // Show the canvas code generator modal
        if (window.CanvasCodeGenerator) {
          window.CanvasCodeGenerator.show();
        } else {
          window.UI.showToast('Canvas code generation coming soon!');
        }
      });
    }

    // Model selector dropdown
    let currentInputMode = 'text'; // 'text' or 'image'
    
    const modelSelectorBtn = document.getElementById('modelSelectorBtn');
    const modelDropdown = document.getElementById('modelDropdown');
    const modelSelectorWrapper = document.querySelector('.model-selector-wrapper');
    const modelSearch = document.getElementById('modelSearch');
    const modelList = document.getElementById('modelList');
    
    if (modelSelectorBtn && modelDropdown) {
      // Toggle dropdown
      modelSelectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdown.classList.toggle('hidden');
        modelSelectorWrapper.classList.toggle('open');
        if (!modelDropdown.classList.contains('hidden')) {
          modelSearch?.focus();
        }
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!modelSelectorWrapper.contains(e.target)) {
          modelDropdown.classList.add('hidden');
          modelSelectorWrapper.classList.remove('open');
        }
      });
      
      // Search functionality
      if (modelSearch) {
        modelSearch.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          const items = modelList.querySelectorAll('.model-item');
          items.forEach(item => {
            const name = item.querySelector('.model-item-name')?.textContent.toLowerCase();
            if (name && name.includes(searchTerm)) {
              item.style.display = 'flex';
            } else {
              item.style.display = 'none';
            }
          });
        });
      }
      
      // Model item click
      modelList?.addEventListener('click', (e) => {
        const item = e.target.closest('.model-item');
        if (item) {
          const modelId = item.getAttribute('data-model-id');
          if (modelId && window.API) {
            window.API.setModel(modelId);
            
            // Update active state
            modelList.querySelectorAll('.model-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Close dropdown
            modelDropdown.classList.add('hidden');
            modelSelectorWrapper.classList.remove('open');
            
            const modelName = item.querySelector('.model-item-name')?.textContent;
            window.UI.showToast(`Switched to ${modelName}`);
          }
        }
      });
    }
    
    // Handle image generation button
    document.getElementById('imageGenBtn')?.addEventListener('click', () => {
      const attachMenu = document.getElementById('attachMenu');
      attachMenu?.classList.add('hidden');
      
      // Switch to image mode
      currentInputMode = 'image';
      if (window.API) {
        window.API.updateModelSelector('image');
        // Set to first image model if currently on text model
        if (window.API.currentModelType === 'text' && window.API.imageModels.length > 0) {
          window.API.setModel(window.API.imageModels[0].id);
        }
      }
      window.UI.showToast('Switched to Image Generation mode');
    });
    
    // Reset to text mode when typing text
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('focus', () => {
        if (currentInputMode === 'image') {
          currentInputMode = 'text';
          if (window.API) {
            window.API.updateModelSelector('text');
            // Switch back to a text model if needed
            if (window.API.currentModelType === 'image' && window.API.textModels.length > 0) {
              window.API.setModel(window.API.textModels[0].id);
            }
          }
        }
      });
    }

    // Themes modal
    const themesBtn = document.getElementById('themesBtn');
    if (themesBtn) {
      themesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.ThemesModal) {
          window.ThemesModal.show();
        }
      });
    }

    // Voice input button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn && window.Speech) {
      voiceBtn.addEventListener('click', () => {
        window.Speech.toggleListening();
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

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (themesModal && !themesModal.classList.contains('hidden')) {
          themesModal.classList.add('hidden');
          document.body.style.overflow = '';
        }

        const shortcutsModal = document.getElementById('shortcutsModal');
        if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
          shortcutsModal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      }
    });

    // Keyboard shortcuts modal
    const keyboardShortcutsBtn = document.getElementById('keyboardShortcutsBtn');
    if (keyboardShortcutsBtn) {
      keyboardShortcutsBtn.addEventListener('click', () => {
        if (window.ShortcutsModal) {
          window.ShortcutsModal.show();
        }
        if (userDropdown) userDropdown.classList.add('hidden');
      });
    }

    // Export chat button
    const exportChatBtn = document.getElementById('exportChatBtn');
    if (exportChatBtn) {
      exportChatBtn.addEventListener('click', () => {
        this.exportCurrentChat();
        if (userDropdown) userDropdown.classList.add('hidden');
      });
    }

    // Clear all chats button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all chats? This action cannot be undone.')) {
          window.Storage.clear();
          window.location.reload();
        }
        if (userDropdown) userDropdown.classList.add('hidden');
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menuBtn');

        if (
          sidebar &&
          menuBtn &&
          !sidebar.contains(e.target) &&
          !menuBtn.contains(e.target) &&
          !sidebar.classList.contains('collapsed')
        ) {
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
  },

  // Export current chat to markdown file
  exportCurrentChat() {
    const activeChat = window.Chat.getActiveChat();
    if (!activeChat || activeChat.messages.length === 0) {
      window.UI.showToast('No messages to export');
      return;
    }

    let markdown = `# ${activeChat.title}\n\n`;
    markdown += `*Exported on ${new Date().toLocaleString()}*\n\n`;
    markdown += `---\n\n`;

    activeChat.messages.forEach(msg => {
      const role = msg.role === 'user' ? '**You**' : '**Assistant**';
      const time = window.UI.formatTime(msg.timestamp);
      markdown += `### ${role} (${time})\n\n`;
      markdown += `${msg.content}\n\n`;
      markdown += `---\n\n`;
    });

    const filename = `chat-${activeChat.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.md`;
    window.UI.downloadAsFile(markdown, filename, 'text/markdown');
    window.UI.showToast('Chat exported successfully');
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
