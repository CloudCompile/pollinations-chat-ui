import MarkdownIt from 'markdown-it';
import markdownitHighlightjs from 'markdown-it-highlightjs';
import hljs from 'highlight.js';

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
});

// Add syntax highlighting plugin
md.use(markdownitHighlightjs);

// Function to render LaTeX math equations
const renderMath = (html) => {
  if (typeof window === 'undefined' || !window.katex || !window.renderMathInElement) {
    return html;
  }

  // Create a temporary div to render math
  const div = document.createElement('div');
  div.innerHTML = html;
  
  try {
    window.renderMathInElement(div, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\[', right: '\\]', display: true},
        {left: '\\(', right: '\\)', display: false}
      ],
      throwOnError: false
    });
  } catch (error) {
    console.error('KaTeX rendering error:', error);
  }
  
  return div.innerHTML;
};

export const formatMessage = (content) => {
  try {
    // First, render markdown
    let html = md.render(content);
    
    // Then, render LaTeX math equations
    html = renderMath(html);
    
    return html;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return md.utils.escapeHtml(content);
  }
};
