/* sidebar.js - updated to support chat rename and robust storage handling */
(function () {
  const storageKey = 'pollinations_chats_v1';

  function loadChats() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse chats from storage', e);
      return null;
    }
  }

  function saveChats(chats) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(chats));
    } catch (e) {
      console.warn('Failed to save chats', e);
    }
  }

  function createChat(title = 'New Chat') {
    return {
      id: String(Date.now()) + Math.random().toString(36).slice(2,6),
      title,
      messages: [],
      createdAt: new Date().toISOString()
    };
  }

  const Sidebar = {
    chats: [],
    activeChatId: null,
    init() {
      const existing = loadChats();
      if (existing && Array.isArray(existing) && existing.length) {
        this.chats = existing;
      } else {
        this.chats = [createChat()];
      }
      this.activeChatId = this.chats[0]?.id || null;
      this.bindUI();
      this.render();
    },
    bindUI() {
      const newBtn = document.getElementById('newChatBtn');
      newBtn.addEventListener('click', () => {
        const c = createChat();
        this.chats.unshift(c);
        this.activeChatId = c.id;
        saveChats(this.chats);
        this.render();
        window.App.Chat.render();
      });
    },
    setActive(id) {
      this.activeChatId = id;
      saveChats(this.chats);
      this.render();
      window.App.Chat.render();
    },
    addMessage(chatId, msg) {
      const c = this.chats.find(ch => ch.id === chatId);
      if (!c) return;
      c.messages.push(msg);
      // if first message, set title to first 30 chars
      if (c.messages.length === 1) {
        c.title = (msg.content || '').slice(0, 32) || 'New Chat';
      }
      saveChats(this.chats);
      this.render();
    },
    updateMessage(chatId, msgId, newContent) {
      const c = this.chats.find(ch => ch.id === chatId);
      if (!c) return false;
      const m = c.messages.find(m => m.id === msgId);
      if (!m) return false;
      m.content = newContent;
      m.edited = new Date().toISOString();
      saveChats(this.chats);
      return true;
    },
    renameChat(chatId, newTitle) {
      const c = this.chats.find(ch => ch.id === chatId);
      if (!c) return false;
      c.title = newTitle || c.title;
      saveChats(this.chats);
      return true;
    },
    deleteChat(id) {
      const idx = this.chats.findIndex(c => c.id === id);
      if (idx === -1) return;
      this.chats.splice(idx, 1);
      if (this.activeChatId === id) {
        if (this.chats.length) this.activeChatId = this.chats[0].id;
        else {
          const nc = createChat();
          this.chats = [nc];
          this.activeChatId = nc.id;
        }
      }
      saveChats(this.chats);
      this.render();
      window.App.Chat.render();
    },
    render() {
      const list = document.getElementById('chatList');
      if (!list) return;
      list.innerHTML = '';
      this.chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'chat-item card-shadow ' + (this.activeChatId === chat.id ? 'active' : '');
        item.innerHTML = `
          <div class="flex justify-between items-start">
            <div>
              <div class="text-sm font-medium truncate">${escapeHtml(chat.title)}</div>
              <div class="text-xs text-muted mt-1">${chat.messages.length} message${chat.messages.length!==1?'s':''}</div>
            </div>
            <div class="ml-3 flex flex-col items-end gap-2">
              <button class="icon-delete text-sm text-red-500" title="Delete">×</button>
            </div>
          </div>
        `;
        item.addEventListener('click', (e) => {
          // ensure clicking delete doesn't trigger setActive
          if (e.target.classList.contains('icon-delete')) return;
          this.setActive(chat.id);
        });
        const delBtn = item.querySelector('.icon-delete');
        delBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (!confirm('Delete this chat?')) return;
          if (this.chats.length === 1) {
            // reset the only chat
            this.chats[0] = createChat();
            this.activeChatId = this.chats[0].id;
            saveChats(this.chats);
            this.render();
            window.App.Chat.render();
            return;
          }
          this.deleteChat(chat.id);
        });
        list.appendChild(item);
      });

      // update global state
      if (!window.App) window.App = {};
      window.App.SidebarState = { chats: this.chats, activeChatId: this.activeChatId };
    }
  };

  function escapeHtml(unsafe){
    return (unsafe+'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  window.App = window.App || {};
  window.App.Sidebar = Sidebar;
})();
