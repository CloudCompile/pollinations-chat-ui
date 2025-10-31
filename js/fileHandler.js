/**
 * FileHandler - File upload and management system
 * Handles file selection, validation, processing, and UI preview for uploaded files
 */

/**
 * FileHandler module
 * @namespace FileHandler
 */
const FileHandler = {
  /**
   * Configuration constants
   * @property {number} maxFileSize - Maximum file size in bytes (10MB)
   * @property {Array<string>} supportedImageTypes - Supported image MIME types
   * @property {Array<string>} supportedDocTypes - Supported document MIME types
   */
  CONFIG: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportedDocTypes: ['application/pdf', 'text/plain', 'text/markdown']
  },
  
  /** @type {Array<Object>} - Array of attached file objects */
  attachedFiles: [],
  
  /**
   * Initialize the file handler
   * Sets up event listeners and logs initialization
   * @memberof FileHandler
   */
  init() {
    this.setupEventListeners();
    console.log('FileHandler initialized');
  },
  
  /**
   * Set up event listeners for file input, drag and drop, and upload button
   * @memberof FileHandler
   * @private
   */
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
  
  /**
   * Handle file selection with improved error handling
   * @param {FileList} files - List of selected files
   * @memberof FileHandler
   */
  async handleFileSelect(files) {
    try {
      const fileArray = Array.from(files);
      const validFiles = [];
      
      // Validate files first
      fileArray.forEach(file => {
        if (this.validateFile(file)) {
          validFiles.push(file);
        }
      });
      
      // Process valid files sequentially to avoid performance issues
      for (const file of validFiles) {
        try {
          await this.processFile(file);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          window.UI?.showToast(`Error processing file ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Error handling file selection:', error);
      window.UI?.showToast('Error handling file selection');
    }
  },
  
  /**
   * Validate file type and size
   * @param {File} file - File to validate
   * @returns {boolean} - True if file is valid, false otherwise
   * @memberof FileHandler
   */
  validateFile(file) {
    // Check file size
    if (file.size > this.CONFIG.maxFileSize) {
      window.UI.showToast(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }
    
    // Check file type
    const isImage = this.CONFIG.supportedImageTypes.includes(file.type);
    const isDocument = this.CONFIG.supportedDocTypes.includes(file.type);
    
    if (!isImage && !isDocument) {
      window.UI.showToast(`File type not supported: ${file.type}`);
      return false;
    }
    
    return true;
  },
  
  /**
   * Process file based on type
   * @param {File} file - File to process
   * @memberof FileHandler
   */
  async processFile(file) {
    if (this.CONFIG.supportedImageTypes.includes(file.type)) {
      await this.processImage(file);
    } else if (this.CONFIG.supportedDocTypes.includes(file.type)) {
      await this.processDocument(file);
    }
  },
  
  /**
   * Process image file with improved error handling and duplicate checking
   * @param {File} file - Image file to process
   * @memberof FileHandler
   */
  async processImage(file) {
    try {
      // Check if file already exists to prevent duplicates
      const existingFile = this.attachedFiles.find(f => f.name === file.name && f.size === file.size);
      if (existingFile) {
        window.UI?.showToast(`File ${file.name} already attached`);
        return;
      }
      
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
      window.UI?.showToast(`Error processing image file: ${error.message}`);
    }
  },
  
  /**
   * Process document file with improved error handling and duplicate checking
   * @param {File} file - Document file to process
   * @memberof FileHandler
   */
  async processDocument(file) {
    try {
      // Check if file already exists to prevent duplicates
      const existingFile = this.attachedFiles.find(f => f.name === file.name && f.size === file.size);
      if (existingFile) {
        window.UI?.showToast(`File ${file.name} already attached`);
        return;
      }
      
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
      window.UI?.showToast(`Error processing document file: ${error.message}`);
    }
  },
  
  /**
   * Create thumbnail for image with improved performance
   * @param {File} file - Image file to create thumbnail for
   * @returns {Promise<string>} - Data URL of thumbnail
   * @memberof FileHandler
   */
  createThumbnail(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Create a small canvas for thumbnail
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxSize = 100;
            
            // Calculate dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw image on canvas with better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get data URL with optimized quality
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch (error) {
            reject(new Error(`Failed to create thumbnail: ${error.message}`));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for thumbnail'));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file for thumbnail'));
      };
      
      reader.readAsDataURL(file);
    });
  },
  
  /**
   * Read file as data URL with improved error handling
   * @param {File} file - File to read
   * @returns {Promise<string>} - Data URL of file
   * @memberof FileHandler
   */
  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File)) {
        reject(new Error('Invalid file provided'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file data'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
      };
      
      reader.onabort = () => {
        reject(new Error('File read was aborted'));
      };
      
      reader.readAsDataURL(file);
    });
  },
  
  /**
   * Read file as text with improved error handling
   * @param {File} file - File to read
   * @returns {Promise<string>} - Text content of file
   * @memberof FileHandler
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File)) {
        reject(new Error('Invalid file provided'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file data'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
      };
      
      reader.onabort = () => {
        reject(new Error('File read was aborted'));
      };
      
      reader.readAsText(file);
    });
  },
  
  /**
   * Create file preview card with improved error handling
   * @param {Object} fileData - File data to create preview for
   * @memberof FileHandler
   */
  createFilePreview(fileData) {
    try {
      const previewArea = document.getElementById('filePreviewArea');
      if (!previewArea) {
        console.warn('File preview area not found');
        return;
      }
      
      const previewCard = document.createElement('div');
      previewCard.className = 'file-preview-card';
      previewCard.setAttribute('data-file-id', fileData.id);
      
      // Sanitize file name to prevent XSS
      const sanitizedName = window.UI?.escapeHtml ?
        window.UI.escapeHtml(fileData.name) :
        fileData.name.replace(/</g, '<').replace(/>/g, '>');
      
      previewCard.innerHTML = `
        <div class="file-thumbnail">
          ${fileData.thumbnail && fileData.thumbnail.startsWith('data:') ?
            `<img src="${fileData.thumbnail}" alt="Thumbnail" onerror="this.style.display='none'">` :
            `<div class="file-icon">${fileData.thumbnail || '📎'}</div>`}
        </div>
        <div class="file-info">
          <div class="file-name">${sanitizedName}</div>
          <div class="file-size">${this.formatFileSize(fileData.size)}</div>
        </div>
        <button class="file-remove-btn" title="Remove file">×</button>
      `;
      
      // Add remove button event listener
      const removeBtn = previewCard.querySelector('.file-remove-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          this.removeFile(fileData.id);
        });
      }
      
      previewArea.appendChild(previewCard);
    } catch (error) {
      console.error('Error creating file preview:', error);
      window.UI?.showToast('Error creating file preview');
    }
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
  
  /**
   * Remove file with improved error handling
   * @param {string} fileId - ID of file to remove
   * @memberof FileHandler
   */
  removeFile(fileId) {
    try {
      // Remove from attached files
      const initialLength = this.attachedFiles.length;
      this.attachedFiles = this.attachedFiles.filter(file => file.id !== fileId);
      
      // Check if file was actually removed
      if (this.attachedFiles.length === initialLength) {
        console.warn(`File with ID ${fileId} not found`);
        return;
      }
      
      // Remove preview card
      const previewCard = document.querySelector(`[data-file-id="${fileId}"]`);
      if (previewCard) {
        previewCard.remove();
      } else {
        console.warn(`Preview card for file ID ${fileId} not found`);
      }
      
      // Update UI
      this.updateFilePreviewArea();
    } catch (error) {
      console.error('Error removing file:', error);
      window.UI?.showToast('Error removing file');
    }
  },
  
  /**
   * Clear all attachments with improved error handling
   * @memberof FileHandler
   */
  clearAttachments() {
    try {
      this.attachedFiles = [];
      const previewArea = document.getElementById('filePreviewArea');
      if (previewArea) {
        previewArea.innerHTML = '';
        this.updateFilePreviewArea();
      } else {
        console.warn('File preview area not found');
      }
    } catch (error) {
      console.error('Error clearing attachments:', error);
      window.UI?.showToast('Error clearing attachments');
    }
  },
  
  /**
   * Get attached files
   * @returns {Array<Object>} - Array of attached files
   * @memberof FileHandler
   */
  getAttachedFiles() {
    return this.attachedFiles;
  },
  
  /**
   * Get file data by ID
   * @param {string} fileId - ID of file to retrieve
   * @returns {Object|null} - File data or null if not found
   * @memberof FileHandler
   */
  getFileById(fileId) {
    if (!fileId) return null;
    return this.attachedFiles.find(file => file.id === fileId) || null;
  },
  
  /**
   * Get total size of all attached files
   * @returns {number} - Total size in bytes
   * @memberof FileHandler
   */
  getTotalSize() {
    return this.attachedFiles.reduce((total, file) => total + (file.size || 0), 0);
  },
  
  /**
   * Check if a file type is supported
   * @param {string} fileType - MIME type to check
   * @returns {boolean} - True if file type is supported
   * @memberof FileHandler
   */
  isFileTypeSupported(fileType) {
    if (!fileType) return false;
    return this.CONFIG.supportedImageTypes.includes(fileType) ||
           this.CONFIG.supportedDocTypes.includes(fileType);
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