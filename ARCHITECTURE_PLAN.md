# Pollinations Chat UI - File Upload & Canvas Architecture Plan

## Executive Summary

This document outlines the architecture for adding two major features to the Pollinations Chat UI:
1. **File Upload System** - Support for images and documents with vision/analysis capabilities
2. **Canvas Code Editor** - Interactive code editor with live preview for AI-generated and user-edited code

Both features will be designed to integrate seamlessly with the existing chat system and Pollinations API.

---

## 1. Current System Analysis

### Existing Architecture
- **Modular JavaScript**: `app.js`, `chat.js`, `api.js`, `ui.js`, `storage.js`, `markdown.js`, `speech.js`
- **API Integration**: Pollinations API for text and image generation
- **Storage**: LocalStorage for chat history and preferences
- **UI Framework**: Vanilla JavaScript with custom CSS modules

### Integration Points Identified
- [`index.html:142-163`](index.html:142-163) - Attach menu with placeholder buttons
- [`js/app.js:197-207`](js/app.js:197-207) - Event handlers for file upload and canvas buttons
- [`js/chat.js:94-114`](js/chat.js:94-114) - Message handling system
- [`js/api.js:170-234`](js/api.js:170-234) - API communication layer
- [`js/storage.js`](js/storage.js) - Data persistence layer

---

## 2. File Upload System Architecture

### 2.1 Overview
Enable users to upload images and documents that can be:
- Analyzed by vision-capable AI models
- Referenced in conversations
- Stored temporarily with chat context
- Displayed inline in messages

### 2.2 Component Design

#### New Module: `js/fileHandler.js`
```javascript
const FileHandler = {
  // Configuration
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  supportedDocTypes: ['application/pdf', 'text/plain', 'text/markdown'],
  
  // Core methods
  init()
  handleFileSelect(files)
  validateFile(file)
  processImage(file)
  processDocument(file)
  createFilePreview(file, data)
  attachFileToMessage(fileData)
  clearAttachments()
}
```

#### File Data Structure
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Original filename
  type: string,            // MIME type
  size: number,            // File size in bytes
  data: string,            // Base64 encoded data or text content
  thumbnail: string,       // Base64 thumbnail for images
  timestamp: number,       // Upload timestamp
  processed: boolean       // Processing status
}
```

### 2.3 UI Components

#### File Upload Button Enhancement
- Hidden file input element
- Drag-and-drop zone overlay
- File preview area above message input
- Individual file cards with remove buttons

#### File Preview Card
```html
<div class="file-preview-card">
  <div class="file-thumbnail"><!-- Image or icon --></div>
  <div class="file-info">
    <div class="file-name">document.pdf</div>
    <div class="file-size">2.3 MB</div>
  </div>
  <button class="file-remove-btn">×</button>
</div>
```

### 2.4 API Integration

#### Vision API Support
- Extend [`js/api.js`](js/api.js) to support multimodal requests
- Format messages with image data for vision models
- Handle base64 image encoding

```javascript
// Enhanced message format
{
  role: 'user',
  content: [
    { type: 'text', text: 'What is in this image?' },
    { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
  ]
}
```

#### Document Processing
- Extract text from PDFs using PDF.js library
- Parse markdown and text files
- Include document content in message context

### 2.5 Storage Strategy

#### Temporary Storage
- Store file data in memory during active chat session
- Clear on page refresh or chat switch
- Option to persist small files (<1MB) in localStorage

#### Message Integration
- Attach file metadata to messages
- Store file references, not full data
- Regenerate previews from stored data

---

## 3. Canvas Code Editor Architecture

### 3.1 Overview
Interactive code editor that allows users to:
- Request AI-generated code
- Edit code in real-time
- See live preview of HTML/CSS/JS
- Save and share code snippets
- Support multiple languages

### 3.2 Component Design

#### New Module: `js/canvas.js`
```javascript
const Canvas = {
  // State management
  activeCanvas: null,
  canvases: [],
  
  // Core methods
  init()
  createCanvas(initialCode, language)
  openCanvas(canvasId)
  closeCanvas(canvasId)
  updateCode(canvasId, code)
  executeCode(canvasId)
  saveCanvas(canvasId)
  exportCanvas(canvasId, format)
}
```

#### Canvas Data Structure
```javascript
{
  id: string,              // Unique identifier
  title: string,           // Canvas title
  language: string,        // 'html', 'javascript', 'python', etc.
  code: {
    html: string,
    css: string,
    javascript: string
  },
  output: string,          // Execution result
  createdAt: number,
  updatedAt: number,
  chatId: string,          // Associated chat
  messageId: string        // Source message
}
```

### 3.3 UI Components

#### Canvas Modal/Panel
```
┌─────────────────────────────────────────────────┐
│ Canvas Editor - Untitled                    [×] │
├─────────────────────────────────────────────────┤
│ [HTML] [CSS] [JS]                    [▶ Run]    │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│   Code Editor        │    Live Preview          │
│   (Monaco/CodeMirror)│    (iframe sandbox)      │
│                      │                          │
│                      │                          │
├──────────────────────┴──────────────────────────┤
│ [Save] [Export] [Share] [Copy Code]             │
└─────────────────────────────────────────────────┘
```

#### Canvas Trigger in Chat
- Button in attach menu
- Inline "Open in Canvas" button for code blocks
- Auto-detect code in AI responses

### 3.4 Code Editor Integration

#### Option 1: Monaco Editor (Recommended)
- Full-featured VS Code editor
- Syntax highlighting for 50+ languages
- IntelliSense and autocomplete
- ~3MB bundle size

#### Option 2: CodeMirror 6
- Lightweight alternative (~500KB)
- Good syntax highlighting
- Extensible architecture

#### Implementation
```html
<!-- Add to index.html -->
<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
```

### 3.5 Live Preview System

#### Sandboxed Iframe
```javascript
// Secure iframe with sandbox attributes
<iframe 
  sandbox="allow-scripts allow-same-origin"
  srcdoc="<!-- Generated HTML -->"
  class="canvas-preview"
></iframe>
```

#### Code Execution
- Combine HTML, CSS, JS into single document
- Inject into sandboxed iframe
- Capture console output
- Handle errors gracefully

#### Security Considerations
- Sandbox all user code
- No access to parent window
- Content Security Policy headers
- XSS prevention

### 3.6 AI Integration

#### Code Generation Flow
1. User requests code via chat or canvas button
2. AI generates code with special formatting
3. System detects code blocks in response
4. "Open in Canvas" button appears
5. Click opens canvas with pre-filled code