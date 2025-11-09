import MarkdownIt from 'markdown-it';
import markdownitHighlightjs from 'markdown-it-highlightjs';
import hljs from 'highlight.js';
import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';

const md = new MarkdownIt({
  html: false, // Disable HTML for security
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="code-block"><code class="hljs language-' + lang + '">' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="code-block"><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
}).use(markdownitHighlightjs);

// Function to render LaTeX math equations
const renderMath = (html) => {
  if (typeof document === 'undefined') {
    return html;
  }

  const div = document.createElement('div');
  div.innerHTML = html;

  try {
    renderMathInElement(div, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      katex
    });
  } catch (error) {
    console.error('KaTeX rendering error:', error);
  }

  return div.innerHTML;
};

export const formatMessage = (content) => {
  if (!content) return '';
  
  try {
    // Ensure content is a string
    const textContent = String(content);
    
    // First, render markdown
    let html = md.render(textContent);
    
    // Then, render LaTeX math equations
    html = renderMath(html);
    
    return html;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    // Return escaped HTML as fallback
    return md.utils.escapeHtml(String(content));
  }
};
