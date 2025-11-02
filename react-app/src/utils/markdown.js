import MarkdownIt from 'markdown-it';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import markdownItKatex from 'markdown-it-katex';
import 'katex/dist/katex.min.css';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

// Add syntax highlighting plugin
md.use(markdownItHighlightjs);

// Add LaTeX support plugin
md.use(markdownItKatex);

// Simple memoization cache
const memoizationCache = new Map();
const MAX_CACHE_SIZE = 100;

export const formatMessage = (content) => {
  // Check if we have a cached result
  if (memoizationCache.has(content)) {
    return memoizationCache.get(content);
  }
  
  // Generate the rendered content
  const rendered = md.render(content);
  
  // Cache the result
  if (memoizationCache.size >= MAX_CACHE_SIZE) {
    // Remove the oldest entry if we've reached the max cache size
    const firstKey = memoizationCache.keys().next().value;
    if (firstKey) {
      memoizationCache.delete(firstKey);
    }
  }
  memoizationCache.set(content, rendered);
  
  return rendered;
};
