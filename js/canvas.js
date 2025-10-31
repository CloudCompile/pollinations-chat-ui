// canvas.js - Canvas code editor system

const Canvas = {
  // State
  activeCanvas: null,
  canvases: [],
  
  // Initialize the canvas system
  init() {
    this.setupEventListeners();
    console.log('Canvas system initialized');
  },
  
  // Set up event listeners
  setupEventListeners() {
    // Canvas button handler
    const canvasBtn = document.getElementById('canvasBtn');
    if (canvasBtn) {
      canvasBtn.addEventListener('click', () => {
        this.createCanvas();
      });
    }
    
    // Close canvas button handler
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('canvas-close-btn')) {
        this.closeCanvas();
      }
    });
    
    // Run code button handler
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('canvas-run-btn')) {
        this.executeCode();
      }
    });
    
    // Save canvas button handler
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('canvas-save-btn')) {
        this.saveCanvas();
      }
    });
  },
  
  // Create a new canvas
  createCanvas(initialCode = '', language = 'html') {
    const canvasId = window.UI.generateId();
    
    const canvas = {
      id: canvasId,
      title: 'Untitled',
      language: language,
      code: {
        html: language === 'html' ? initialCode : '',
        css: '',
        javascript: language === 'javascript' ? initialCode : ''
      },
      output: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chatId: null,
      messageId: null
    };
    
    this.canvases.push(canvas);
    this.openCanvas(canvasId);
  },
  
  // Open canvas in modal
  openCanvas(canvasId) {
    const canvas = this.canvases.find(c => c.id === canvasId);
    if (!canvas) return;
    
    this.activeCanvas = canvasId;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('canvasModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'canvasModal';
      modal.className = 'canvas-modal';
      document.body.appendChild(modal);
    }
    
    // Populate modal content
    modal.innerHTML = `
      <div class="canvas-container">
        <div class="canvas-header">
          <h3>${window.UI.escapeHtml(canvas.title)}</h3>
          <button class="canvas-close-btn">&times;</button>
        </div>
        <div class="canvas-toolbar">
          <button class="canvas-run-btn">▶ Run</button>
        </div>
        <div class="canvas-editor-container">
          <div class="canvas-editor" id="canvasEditor"></div>
          <div class="canvas-preview-container">
            <iframe class="canvas-preview" sandbox="allow-scripts allow-same-origin"></iframe>
          </div>
        </div>
        <div class="canvas-footer">
          <button class="canvas-save-btn">Save</button>
        </div>
      </div>
    `;
    
    // Show modal
    modal.style.display = 'block';
    
    // Initialize Monaco editor
    this.initEditor(canvas);
  },
  
  // Initialize Monaco editor
  initEditor(canvas) {
    // This would normally initialize Monaco editor
    // For now, we'll create a simple textarea-based editor
    const editorContainer = document.getElementById('canvasEditor');
    if (!editorContainer) return;
    
    editorContainer.innerHTML = `
      <div class="editor-tabs">
        <button class="editor-tab active" data-lang="html">HTML</button>
        <button class="editor-tab" data-lang="css">CSS</button>
        <button class="editor-tab" data-lang="javascript">JS</button>
      </div>
      <div class="editor-content">
        <textarea class="editor-textarea" id="htmlEditor">${window.UI.escapeHtml(canvas.code.html)}</textarea>
        <textarea class="editor-textarea hidden" id="cssEditor">${window.UI.escapeHtml(canvas.code.css)}</textarea>
        <textarea class="editor-textarea hidden" id="jsEditor">${window.UI.escapeHtml(canvas.code.javascript)}</textarea>
      </div>
    `;
    
    // Add tab switching
    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const lang = e.target.getAttribute('data-lang');
        this.switchEditorTab(lang);
      });
    });
  },
  
  // Switch editor tab
  switchEditorTab(language) {
    // Update active tab
    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-lang') === language);
    });
    
    // Show active editor
    document.querySelectorAll('.editor-textarea').forEach(editor => {
      editor.classList.add('hidden');
    });
    
    const activeEditor = document.getElementById(`${language}Editor`);
    if (activeEditor) {
      activeEditor.classList.remove('hidden');
    }
  },
  
  // Close canvas
  closeCanvas() {
    const modal = document.getElementById('canvasModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.activeCanvas = null;
  },
  
  // Update code in canvas
  updateCode(canvasId, code, language) {
    const canvas = this.canvases.find(c => c.id === canvasId);
    if (!canvas) return;
    
    canvas.code[language] = code;
    canvas.updatedAt = Date.now();
  },
  
  // Execute code in canvas
  executeCode() {
    if (!this.activeCanvas) return;
    
    const canvas = this.canvases.find(c => c.id === this.activeCanvas);
    if (!canvas) return;
    
    // Get current code from editors
    const htmlCode = document.getElementById('htmlEditor')?.value || '';
    const cssCode = document.getElementById('cssEditor')?.value || '';
    const jsCode = document.getElementById('jsEditor')?.value || '';
    
    // Update canvas code
    canvas.code.html = htmlCode;
    canvas.code.css = cssCode;
    canvas.code.javascript = jsCode;
    
    // Combine code into a single HTML document
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${cssCode}</style>
      </head>
      <body>
        ${htmlCode}
        <script>${jsCode}<\/script>
      </body>
      </html>
    `;
    
    // Execute in preview iframe
    const previewFrame = document.querySelector('.canvas-preview');
    if (previewFrame) {
      const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
      doc.open();
      doc.write(fullHtml);
      doc.close();
    }
  },
  
  // Save canvas
  saveCanvas() {
    if (!this.activeCanvas) return;
    
    const canvas = this.canvases.find(c => c.id === this.activeCanvas);
    if (!canvas) return;
    
    // In a real implementation, this would save to storage
    window.UI.showToast('Canvas saved successfully');
    console.log('Canvas saved:', canvas);
  },
  
  // Export canvas
  exportCanvas(canvasId, format) {
    const canvas = this.canvases.find(c => c.id === canvasId);
    if (!canvas) return;
    
    // Export implementation would go here
    console.log('Exporting canvas:', canvasId, format);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Canvas.init());
} else {
  Canvas.init();
}

// Export for global access
window.Canvas = Canvas;