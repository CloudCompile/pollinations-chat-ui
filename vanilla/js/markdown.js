// js/markdown.js
// Adds proper rendering for GitHub-style checklists in message content.
// Integrate renderChecklists into your existing markdown pipeline (before markdown-to-HTML conversion).

/* eslint-disable no-useless-escape */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert checklist lines like:
 * - [ ] item
 * - [x] item
 * into a non-interactive HTML checkbox + label that can be styled.
 *
 * This function is safe to run before a markdown renderer: it replaces the raw
 * checklist syntax with HTML that will survive markdown rendering.
 */
function renderChecklists(text) {
  if (typeof text !== 'string') return text;
  // Process each checklist line (handles leading spaces)
  return text.replace(/^\s*[-*]\s*\[(\s|x|X)\]\s+(.*)$/gm, (match, checkedChar, rest) => {
    const checked = /[xX]/.test(checkedChar);
    const label = escapeHtml(rest);
    // we output an inline HTML label; markdown renderers typically allow raw HTML
    return `${match.replace(/\[(\s|x|X)\]/, '[<input type="checkbox" disabled ' + (checked ? 'checked' : '') + '>]} <label class="markdown-checklist"> ${label}</label>`;
  });
}

/**
 * formatMessage: apply checklist rendering then pass through your markdown renderer.
 * Replace `markdownRender` with the markdown rendering function used in your app
 * (e.g., marked, markdown-it). If you already escape HTML elsewhere adjust accordingly.
 */
function formatMessage(raw) {
  if (raw == null) return '';
  // First, escape or sanitize as your pipeline expects; here we treat raw as markdown source
  // Then convert checklists
  const withChecklists = renderChecklists(String(raw));
  // Now pass to the markdown renderer you use. Example placeholder:
  if (typeof window.markdownRender === 'function') {
    return window.markdownRender(withChecklists);
  }
  // Fallback naive conversion: escape then simple line breaks
  const escaped = escapeHtml(withChecklists);
  return escaped.replace(/\n/g, '<br/>');
}

// Expose functions if required elsewhere
window.formatMessage = formatMessage;
window.renderChecklists = renderChecklists;
