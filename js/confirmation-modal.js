// confirmation-modal.js - Confirmation modal component

const ConfirmationModal = {
  // State variables
  isOpen: false,
  onConfirm: null,
  onCancel: null,
  title: "Confirm Action",
  message: "Are you sure you want to proceed?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  confirmButtonClass: "btn-confirm",

  // Initialize the confirmation modal
  init() {
    this.createModal();
    this.setupEventListeners();
  },

  // Create the modal HTML and inject it into the DOM
  createModal() {
    const modalHTML = `
      <div id="confirmationModal" class="confirmation-modal-backdrop hidden">
        <div class="confirmation-modal">
          <div class="confirmation-modal-header">
            <h3 id="confirmationModalTitle">${this.title}</h3>
            <button class="confirmation-modal-close" id="closeConfirmationModal" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="confirmation-modal-body">
            <p id="confirmationModalMessage">${this.message}</p>
          </div>
          <div class="confirmation-modal-footer">
            <button class="btn-cancel" id="cancelConfirmationBtn">${this.cancelText}</button>
            <button class="${this.confirmButtonClass}" id="confirmBtn">${this.confirmText}</button>
          </div>
        </div>
      </div>
    `;

    // Insert the modal into the body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  // Setup event listeners
  setupEventListeners() {
    const modal = document.getElementById('confirmationModal');
    if (!modal) return;

    // Close button
    const closeBtn = document.getElementById('closeConfirmationModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelConfirmationBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }

    // Confirm button
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.handleConfirm());
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

  // Show the confirmation modal
  show(options = {}) {
    // Update options if provided
    this.title = options.title || this.title;
    this.message = options.message || this.message;
    this.confirmText = options.confirmText || this.confirmText;
    this.cancelText = options.cancelText || this.cancelText;
    this.confirmButtonClass = options.confirmButtonClass || this.confirmButtonClass;
    this.onConfirm = options.onConfirm || this.onConfirm;
    this.onCancel = options.onCancel || this.onCancel;

    // Update modal content
    const titleElement = document.getElementById('confirmationModalTitle');
    const messageElement = document.getElementById('confirmationModalMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelConfirmationBtn');

    if (titleElement) titleElement.textContent = this.title;
    if (messageElement) messageElement.textContent = this.message;
    if (confirmBtn) {
      confirmBtn.textContent = this.confirmText;
      confirmBtn.className = this.confirmButtonClass;
    }
    if (cancelBtn) cancelBtn.textContent = this.cancelText;

    // Show the modal
    const modal = document.getElementById('confirmationModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      this.isOpen = true;
    }
  },

  // Close the confirmation modal
  close() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      this.isOpen = false;
    }
  },

  // Handle confirm action
  handleConfirm() {
    if (this.onConfirm) {
      this.onConfirm();
    }
    this.close();
  },

  // Handle cancel action
  handleCancel() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.close();
  },

  // Set confirm callback
  setOnConfirm(callback) {
    this.onConfirm = callback;
  },

  // Set cancel callback
  setOnCancel(callback) {
    this.onCancel = callback;
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ConfirmationModal.init());
} else {
  ConfirmationModal.init();
}

// Export for global access
window.ConfirmationModal = ConfirmationModal;