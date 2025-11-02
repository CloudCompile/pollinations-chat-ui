// canvas-code-generator.js - Canvas-based code generator component

const CanvasCodeGenerator = {
  // State variables
  isDrawing: false,
  color: '#000000',
  brushSize: 5,
  generatedCode: '',
  isGenerating: false,
  showCode: false,

  // Initialize the canvas code generator
  init() {
    this.createModal();
    this.setupEventListeners();
  },

  // Create the modal HTML and inject it into the DOM
  createModal() {
    const modalHTML = `
      <div id="canvasCodeGenerator" class="canvas-code-generator hidden">
        <div class="canvas-header">
          <h2>Canvas Code Generator</h2>
          <button class="close-btn" id="closeCanvasBtn" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        <div class="canvas-controls">
          <div class="control-group">
            <label>Color:</label>
            <input type="color" id="colorPicker" value="${this.color}" />
          </div>
          
          <div class="control-group">
            <label>Brush Size:</label>
            <input type="range" id="brushSizeSlider" min="1" max="20" value="${this.brushSize}" />
            <span id="brushSizeValue">${this.brushSize}px</span>
          </div>
          
          <div class="control-group">
            <button id="clearCanvasBtn">Clear Canvas</button>
            <button id="generateCodeBtn" class="generate-btn">Generate Code</button>
          </div>
        </div>
        
        <div class="canvas-container">
          <canvas id="drawingCanvas" width="600" height="400" class="drawing-canvas"></canvas>
        </div>
        
        <div id="codeOutput" class="code-output hidden">
          <h3>Generated Code:</h3>
          <pre class="code-block">
            <code id="generatedCodeContent"></code>
          </pre>
          <button id="copyCodeBtn" class="copy-btn">Copy to Clipboard</button>
        </div>
      </div>
    `;

    // Insert the modal into the body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  // Setup event listeners
  setupEventListeners() {
    const modal = document.getElementById('canvasCodeGenerator');
    if (!modal) return;

    // Close button
    const closeBtn = document.getElementById('closeCanvasBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Color picker
    const colorPicker = document.getElementById('colorPicker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        this.color = e.target.value;
      });
    }

    // Brush size slider
    const brushSizeSlider = document.getElementById('brushSizeSlider');
    const brushSizeValue = document.getElementById('brushSizeValue');
    if (brushSizeSlider && brushSizeValue) {
      brushSizeSlider.addEventListener('input', (e) => {
        this.brushSize = e.target.value;
        brushSizeValue.textContent = `${this.brushSize}px`;
      });
    }

    // Clear canvas button
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    if (clearCanvasBtn) {
      clearCanvasBtn.addEventListener('click', () => this.clearCanvas());
    }

    // Generate code button
    const generateCodeBtn = document.getElementById('generateCodeBtn');
    if (generateCodeBtn) {
      generateCodeBtn.addEventListener('click', () => this.generateCode());
    }

    // Copy code button
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => this.copyCodeToClipboard());
    }

    // Canvas drawing events
    const canvas = document.getElementById('drawingCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      
      // Set initial background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
      canvas.addEventListener('mousemove', (e) => this.draw(e));
      canvas.addEventListener('mouseup', () => this.stopDrawing());
      canvas.addEventListener('mouseout', () => this.stopDrawing());
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });
  },

  // Show the canvas code generator modal
  show() {
    const modal = document.getElementById('canvasCodeGenerator');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  },

  // Close the canvas code generator modal
  close() {
    const modal = document.getElementById('canvasCodeGenerator');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  // Start drawing on canvas
  startDrawing(e) {
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    this.isDrawing = true;
  },

  // Draw on canvas
  draw(e) {
    if (!this.isDrawing) return;
    
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineWidth = this.brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.color;
    ctx.lineTo(x, y);
    ctx.stroke();
  },

  // Stop drawing on canvas
  stopDrawing() {
    this.isDrawing = false;
  },

  // Clear the canvas
  clearCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    this.generatedCode = '';
    this.showCode = false;
    
    const codeOutput = document.getElementById('codeOutput');
    if (codeOutput) {
      codeOutput.classList.add('hidden');
    }
  },

  // Generate code from canvas drawing
  async generateCode() {
    this.isGenerating = true;
    this.updateGenerateButton();
    
    try {
      // In a real implementation, this would send the canvas data to an API
      // For now, we'll simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get canvas data
      const canvas = document.getElementById('drawingCanvas');
      if (!canvas) return;
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Simulate code generation based on the drawing
      this.generatedCode = `// Generated code from your drawing
function drawPattern() {
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  
  // Set background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw your pattern
  ctx.strokeStyle = '${this.color}';
  ctx.lineWidth = ${this.brushSize};
  ctx.lineCap = 'round';
  
  // Add your drawing logic here
  // This is a placeholder for your actual drawing
  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.lineTo(200, 100);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(150, 150, 50, 0, 2 * Math.PI);
  ctx.stroke();
}

// Call the function to draw
drawPattern();`;
      
      this.showCode = true;
      
      // Display the generated code
      const codeOutput = document.getElementById('codeOutput');
      const generatedCodeContent = document.getElementById('generatedCodeContent');
      if (codeOutput && generatedCodeContent) {
        generatedCodeContent.textContent = this.generatedCode;
        codeOutput.classList.remove('hidden');
      }
      
      // Call the onCodeGenerated callback if provided
      if (this.onCodeGenerated) {
        this.onCodeGenerated(this.generatedCode);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      this.generatedCode = '// Error generating code. Please try again.';
      
      // Display the error
      const codeOutput = document.getElementById('codeOutput');
      const generatedCodeContent = document.getElementById('generatedCodeContent');
      if (codeOutput && generatedCodeContent) {
        generatedCodeContent.textContent = this.generatedCode;
        codeOutput.classList.remove('hidden');
      }
    } finally {
      this.isGenerating = false;
      this.updateGenerateButton();
    }
  },

  // Update the generate button text and state
  updateGenerateButton() {
    const generateBtn = document.getElementById('generateCodeBtn');
    if (generateBtn) {
      generateBtn.disabled = this.isGenerating;
      generateBtn.textContent = this.isGenerating ? 'Generating...' : 'Generate Code';
    }
  },

  // Copy generated code to clipboard
  copyCodeToClipboard() {
    if (!this.generatedCode) return;
    
    navigator.clipboard.writeText(this.generatedCode)
      .then(() => {
        // Show a toast or some feedback
        if (window.UI && window.UI.showToast) {
          window.UI.showToast('Code copied to clipboard!');
        } else {
          alert('Code copied to clipboard!');
        }
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
        if (window.UI && window.UI.showToast) {
          window.UI.showToast('Failed to copy code');
        } else {
          alert('Failed to copy code');
        }
      });
  },

  // Set callback for when code is generated
  setOnCodeGenerated(callback) {
    this.onCodeGenerated = callback;
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CanvasCodeGenerator.init());
} else {
  CanvasCodeGenerator.init();
}

// Export for global access
window.CanvasCodeGenerator = CanvasCodeGenerator;