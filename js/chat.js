// js/chat.js
// Improve chat title update logic to derive title from the first user message (even if assistant messages exist).

/**
 * sanitizeTitleCandidate: make a compact, safe title from a message string
 */
function sanitizeTitleCandidate(text) {
  if (!text) return '';
  const s = String(text).trim();
  const firstLine = s.split(/\r?\n/)[0].trim();
  if (!firstLine) return '';
  const maxLen = 40;
  return firstLine.length > maxLen ? firstLine.slice(0, maxLen).trim() + '…' : firstLine;
}

/**
 * updateChatTitleIfNeeded: update chat.title if it looks like a default placeholder
 * Use only for user-role messages.
 */
function updateChatTitleIfNeeded(chat, message) {
  if (!chat || !message) return;
  if (message.role !== 'user') return;
  const title = chat.title || '';
  const isDefault = !title || /^(new chat|untitled|chat)/i.test(title);
  if (!isDefault) return;
  // Prefer to extract from message.content which might be a string or array
  let contentText = '';
  if (typeof message.content === 'string') contentText = message.content;
  else if (Array.isArray(message.content)) {
    // If the content is structured (vision + text), try to find text segment
    const textSeg = message.content.find(c => c && (c.type === 'text' || c.text));
    if (textSeg) contentText = textSeg.text || textSeg.content || '';
    else {
      // fallback: join textual fragments
      contentText = message.content.map(c => (typeof c === 'string' ? c : (c.text || ''))).join(' ');
    }
  } else if (message.text) contentText = message.text;

  const candidate = sanitizeTitleCandidate(contentText);
  if (candidate) {
    chat.title = candidate;
    if (typeof window.saveChatsToStorage === 'function') window.saveChatsToStorage();
    if (typeof window.renderChatList === 'function') window.renderChatList();
  }
}

/**
 * addMessage: example integration point. Calls updateChatTitleIfNeeded for user messages.
 * Make sure to keep your existing rendering logic; insert updateChatTitleIfNeeded after message push.
 */
function addMessage(chatId, message) {
  if (!chatId || !message) return;
  const chat = window.getChatById ? window.getChatById(chatId) : null;
  if (!chat) return;
  chat.messages = chat.messages || [];
  chat.messages.push(message);

  // update title if needed based on first user message rules
  updateChatTitleIfNeeded(chat, message);

  // existing rendering flow: ensure your code below renders message and persists chat
  if (typeof window.saveChatsToStorage === 'function') window.saveChatsToStorage();
  if (typeof window.renderCurrentChat === 'function') window.renderCurrentChat();
}
