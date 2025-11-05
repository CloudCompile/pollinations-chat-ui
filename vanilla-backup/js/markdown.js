// markdown.js - Markdown and LaTeX rendering

const Markdown = {
  md: null,

  // Initialize markdown renderer
  init() {
    if (typeof markdownit === 'undefined') {
      console.error('markdown-it library not loaded');
      return;
    }

    // Initialize markdown-it with custom options
    this.md = markdownit({
      html: false, // Disable HTML for security
      linkify: true, // Auto-convert URLs to links
      typographer: true, // Enable smart quotes and other typographic replacements
      breaks: true, // Convert \n to <br>
      highlight: function (str, lang) {
        // Syntax highlighting for code blocks
        if (lang && window.hljs && window.hljs.getLanguage(lang)) {
          try {
            return '<pre class="code-block"><code class="hljs language-' + lang + '">' +
                   window.hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                   '</code></pre>';
          } catch (__) {}
        }
        return '<pre class="code-block"><code class="hljs">' + this.md.utils.escapeHtml(str) + '</code></pre>';
      }.bind(this)
    });

    // Add table support
    this.md.use(window.markdownitHighlightjs || function(){});

    console.log('Markdown renderer initialized');
  },

  // Render markdown to HTML
  render(content) {
    if (!this.md) {
      return this.escapeHtml(content);
    }

    try {
      // First, render markdown
      let html = this.md.render(content);

      // Then, render LaTeX math equations
      html = this.renderMath(html);

      return html;
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return this.escapeHtml(content);
    }
  },

  // Render inline markdown (without wrapping in <p> tags)
  renderInline(content) {
    if (!this.md) {
      return this.escapeHtml(content);
    }

    try {
      return this.md.renderInline(content);
    } catch (error) {
      console.error('Inline markdown rendering error:', error);
      return this.escapeHtml(content);
    }
  },

  // Render LaTeX math in HTML
  renderMath(html) {
    if (typeof katex === 'undefined') {
      return html;
    }

    try {
      // Replace display math: $$ ... $$
      html = html.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
        } catch (e) {
          console.error('KaTeX display math error:', e);
          return match;
        }
      });

      // Replace inline math: $ ... $ (but not $$)
      html = html.replace(/\$([^$\n]+)\$/g, (match, math) => {
        // Skip if it's part of $$
        if (match.startsWith('$$') || match.endsWith('$$')) {
          return match;
        }
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html'
          });
        } catch (e) {
          console.error('KaTeX inline math error:', e);
          return match;
        }
      });

      // Also support LaTeX-style delimiters: \[ ... \] and \( ... \)
      html = html.replace(/\\\[([^\]]+)\\\]/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
        } catch (e) {
          console.error('KaTeX bracket display math error:', e);
          return match;
        }
      });

      html = html.replace(/\\\(([^)]+)\\\)/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html'
          });
        } catch (e) {
          console.error('KaTeX paren inline math error:', e);
          return match;
        }
      });

    } catch (error) {
      console.error('Math rendering error:', error);
    }

    return html;
  },

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Format message with markdown and custom formatting
  formatMessage(content) {
    if (!content) return '';

    try {
      // First, handle custom checklist syntax
      let formatted = content;

      // Convert checklist items
      formatted = formatted.replace(/^- \[x\] (.+)$/gm, (match, text) => {
        return `- ✅ ${text}`;
      });

      formatted = formatted.replace(/^- \[ \] (.+)$/gm, (match, text) => {
        return `- ☐ ${text}`;
      });

      // Render with markdown
      return this.render(formatted);
    } catch (error) {
      console.error('Message formatting error:', error);
      return this.escapeHtml(content);
    }
  },

  // Parse code blocks from markdown
  extractCodeBlocks(content) {
    const codeBlocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim(),
        fullMatch: match[0]
      });
    }

    return codeBlocks;
  },

  // Render a table from markdown
  renderTable(rows) {
    if (!rows || rows.length === 0) return '';

    let html = '<table class="markdown-table">';
    
    // Header row
    if (rows.length > 0) {
      html += '<thead><tr>';
      rows[0].forEach(cell => {
        html += `<th>${this.renderInline(cell)}</th>`;
      });
      html += '</tr></thead>';
    }

    // Body rows
    if (rows.length > 2) {
      html += '<tbody>';
      for (let i = 2; i < rows.length; i++) {
        html += '<tr>';
        rows[i].forEach(cell => {
          html += `<td>${this.renderInline(cell)}</td>`;
        });
        html += '</tr>';
      }
      html += '</tbody>';
    }

    html += '</table>';
    return html;
  },

  // Syntax highlighting for code
  highlightCode(code, language) {
    if (typeof hljs !== 'undefined' && language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(code, { language: language, ignoreIllegals: true }).value;
      } catch (error) {
        console.error('Code highlighting error:', error);
      }
    }
    return this.escapeHtml(code);
  }
};

// Export for use in other modules
window.Markdown = Markdown;
