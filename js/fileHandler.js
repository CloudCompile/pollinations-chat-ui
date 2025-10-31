// fileHandler.js - File upload and management system

const FileHandler = {
  // Configuration
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  supportedDocTypes: ['application/pdf', 'text/plain', 'text/markdown'],
  
  // State
  attachedFiles: [],
  
  // Initialize the file handler
  init() {
    this.setupEventListeners();
    console.log('FileHandler initialized');
  },
  
  // Set up event listeners
  setupEventListeners() {
    // File input change handler
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFileSelect(e.target.files);
      });
    }
    
    // Drag and drop handlers
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });
      
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        this.handleFileSelect(e.dataTransfer.files);
      });
    }
    
    // File upload button handler
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    if (fileUploadBtn) {
      fileUploadBtn.addEventListener('click', () => {
        document.getElementById('fileInput')?.click();
      });
    }
  },
  
  // Handle file selection
  handleFileSelect(files) {
    Array.from(files).forEach(file => {
      if (this.validateFile(file)) {
        this.processFile(file);
      }
    });
  },
  
  // Validate file
  validateFile(file) {
    // Check file size
    if (file.size > this.maxFileSize) {
      window.UI.showToast(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }
    
    // Check file type
    const isImage = this.supportedImageTypes.includes(file.type);
    const isDocument = this.supportedDocTypes.includes(file.type);
    
    if (!isImage && !isDocument) {
      window.UI.showToast(`File type not supported: ${file.type}`);
      return false;
    }
    
    return true;
  },
  
  // Process file based on type
  async processFile(file) {
    if (this.supportedImageTypes.includes(file.type)) {
      await this.processImage(file);
    } else if (this.supportedDocTypes.includes(file.type)) {
      await this.processDocument(file);
    }
  },
  
  // Process image file
  async processImage(file) {
    try {
      // Create file data object
      const fileData = {
        id: window.UI.generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        timestamp: Date.now(),
        processed: false
      };
      
      // Create thumbnail
      const thumbnail = await this.createThumbnail(file);
      fileData.thumbnail = thumbnail;
      
      // Read file as data URL
      const dataUrl = await this.readFileAsDataUrl(file);
      fileData.data = dataUrl;
      fileData.processed = true;
      
      // Add to attached files
      this.attachedFiles.push(fileData);
      
      // Create preview
      this.createFilePreview(fileData);
      
      // Update UI
      this.updateFilePreviewArea();
      
      console.log('Image processed:', fileData);
    } catch (error) {
      console.error('Error processing image:', error);
      window.UI.showToast('Error processing image file');
    }
  },
  
  // Process document file
  async processDocument(file) {
    try {
      // Create file data object
      const fileData = {
        id: window.UI.generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        timestamp: Date.now(),
        processed: false
      };
      
      // Read file content
      if (file.type === 'application/pdf') {
        // For PDFs, we'll just show a PDF icon for now
        fileData.data = 'PDF document';
        fileData.thumbnail = '📄';
      } else {
        // For text files, read the content
        const content = await this.readFileAsText(file);
        fileData.data = content;
        fileData.thumbnail = '📝';
      }
      
      fileData.processed = true;
      
      // Add to attached files
      this.attachedFiles.push(fileData);
      
      // Create preview
      this.createFilePreview(fileData);
      
      // Update UI
      this.updateFilePreviewArea();
      
      console.log('Document processed:', fileData);
    } catch (error) {
      console.error('Error processing document:', error);
      window.UI.showToast('Error processing document file');
    }
  },
  
  // Create thumbnail for image
  createThumbnail(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.onload = () => {
          // Create a small canvas for thumbnail
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 100;
          canvas.height = 100;
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, 100, 100);
          
          // Get data URL
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    });
  },
  
  // Read file as data URL
  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },
  
  // Read file as text
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },
  
  // Create file preview card
  createFilePreview(fileData) {
    const previewArea = document.getElementById('filePreviewArea');
    if (!previewArea) return;
    
    const previewCard = document.createElement('div');
    previewCard.className = 'file-preview-card';
    previewCard.setAttribute('data-file-id', fileData.id);
    
    previewCard.innerHTML = `
      <div class="file-thumbnail">
        ${fileData.thumbnail.startsWith('data:') ? 
          `<img src="${fileData.thumbnail}" alt="Thumbnail">` : 
          `<div class="file-icon">${fileData.thumbnail}</div>`}
      </div>
      <div class="file-info">
        <div class="file-name">${window.UI.escapeHtml(fileData.name)}</div>
        <div class="file-size">${this.formatFileSize(fileData.size)}</div>
      </div>
      <button class="file-remove-btn" title="Remove file">×</button>
    `;
    
    // Add remove button event listener
    const removeBtn = previewCard.querySelector('.file-remove-btn');
    removeBtn.addEventListener('click', () => {
      this.removeFile(fileData.id);
    });
    
    previewArea.appendChild(previewCard);
  },
  
  // Update file preview area visibility
  updateFilePreviewArea() {
    const previewArea = document.getElementById('filePreviewArea');
    if (!previewArea) return;
    
    if (this.attachedFiles.length > 0) {
      previewArea.classList.remove('hidden');
    } else {
      previewArea.classList.add('hidden');
    }
  },
  
  // Remove file
  removeFile(fileId) {
    // Remove from attached files
    this.attachedFiles = this.attachedFiles.filter(file => file.id !== fileId);
    
    // Remove preview card
    const previewCard = document.querySelector(`[data-file-id="${fileId}"]`);
    if (previewCard) {
      previewCard.remove();
    }
    
    // Update UI
    this.updateFilePreviewArea();
  },
  
  // Clear all attachments
  clearAttachments() {
    this.attachedFiles = [];
    const previewArea = document.getElementById('filePreviewArea');
    if (previewArea) {
      previewArea.innerHTML = '';
      this.updateFilePreviewArea();
    }
  },
  
  // Get attached files
  getAttachedFiles() {
    return this.attachedFiles;
  },
  
  // Format file size
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FileHandler.init());
} else {
  FileHandler.init();
}

// Export for global access
window.FileHandler = FileHandler;