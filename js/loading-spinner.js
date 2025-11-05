// loading-spinner.js - Loading spinner component

const LoadingSpinner = {
  // Create a loading spinner element
  create(size = 'medium', message = '') {
    const container = document.createElement('div');
    container.className = 'loading-spinner-container';
    
    const spinner = document.createElement('div');
    spinner.className = `loading-spinner loading-spinner-${size}`;
    
    // Create 4 rings for the spinner
    for (let i = 0; i < 4; i++) {
      const ring = document.createElement('div');
      ring.className = 'loading-spinner-ring';
      spinner.appendChild(ring);
    }
    
    container.appendChild(spinner);
    
    if (message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'loading-message';
      messageElement.textContent = message;
      container.appendChild(messageElement);
    }
    
    return container;
  },

  // Show a loading spinner in a container
  showInContainer(container, size = 'medium', message = '') {
    if (!container) return null;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create and append spinner
    const spinner = this.create(size, message);
    container.appendChild(spinner);
    
    return spinner;
  },

  // Show a loading spinner as a toast notification
  showAsToast(message = 'Loading...', duration = 0) {
    if (window.Toast) {
      return window.Toast.show(message, 'info', duration);
    } else if (window.UI && window.UI.showToast) {
      window.UI.showToast(message, duration);
      return null;
    }
    return null;
  },

  // Hide a toast notification
  hideToast(toastId) {
    if (toastId && window.Toast) {
      window.Toast.removeToast(toastId);
    }
  }
};

// Export for global access
window.LoadingSpinner = LoadingSpinner;