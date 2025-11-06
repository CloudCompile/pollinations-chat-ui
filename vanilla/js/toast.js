// toast.js - Toast notification system

const Toast = {
  // State variables
  toasts: [],
  toastId: 0,

  // Initialize the toast system
  init() {
    this.createContainer();
  },

  // Create the toast container
  createContainer() {
    // Check if container already exists
    if (document.getElementById('toastsContainer')) return;

    const container = document.createElement('div');
    container.id = 'toastsContainer';
    container.className = 'toasts-container';
    document.body.appendChild(container);
  },

  // Show a toast notification
  show(message, type = 'info', duration = 5000) {
    // Create toast element
    const toastId = this.toastId++;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('data-toast-id', toastId);

    // Get icon based on type
    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="toast-icon">
        ${icon}
      </div>
      <div class="toast-content">
        ${this.escapeHtml(message)}
      </div>
      <button class="toast-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    `;

    // Add to container
    const container = document.getElementById('toastsContainer');
    if (container) {
      container.appendChild(toast);
    }

    // Add to state
    this.toasts.push({ id: toastId, element: toast });

    // Setup close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.removeToast(toastId);
      });
    }

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toastId);
      }, duration);
    }

    return toastId;
  },

  // Remove a toast notification
  removeToast(toastId) {
    const toastIndex = this.toasts.findIndex(t => t.id === toastId);
    if (toastIndex === -1) return;

    const toast = this.toasts[toastIndex];
    if (toast.element) {
      // Add exit animation
      toast.element.classList.add('toast-exit');
      
      // Remove after animation completes
      setTimeout(() => {
        if (toast.element && toast.element.parentNode) {
          toast.element.parentNode.removeChild(toast.element);
        }
        // Remove from state
        this.toasts.splice(toastIndex, 1);
      }, 300);
    } else {
      // Remove from state
      this.toasts.splice(toastIndex, 1);
    }
  },

  // Remove all toast notifications
  removeAll() {
    // Create a copy of the array since we'll be modifying it
    const toastsCopy = [...this.toasts];
    toastsCopy.forEach(toast => {
      this.removeToast(toast.id);
    });
  },

  // Get icon based on type
  getIcon(type) {
    switch (type) {
      case 'success':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        `;
      case 'error':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        `;
      case 'warning':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        `;
      case 'info':
      default:
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        `;
    }
  },

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Toast.init());
} else {
  Toast.init();
}

// Export for global access
window.Toast = Toast;