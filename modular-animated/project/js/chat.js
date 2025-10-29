/* chat.js - updated: message edit, real chat API call (configurable), improved rendering */
(function () {
  function nowISO(){ return new Date().toISOString(); }
  function formatTime(iso){
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const Chat = {
    isGenerating: false,
    init() {
      this.cacheDOM();
      this.bindUI();
      this.render();
      document.addEventListener('settings:changed', () => this.render());
    },
    cacheDOM() {
      this.messagesArea = document.getElementById('messagesArea');
      this.titleEl = document.getElementById('chatTitle');
      this.inputEl = document.getElementById('messageInput');
      this.sendBtn = document.getElementById('sendBtn');
    },
    bindUI() {
      this.sendBtn.addEventListener('click', () => this.handleSend());
      this.inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSend();
        }
      });
      this.inputEl.addEventListener('input', () => {
        this.updateSendState();
      });

      // title rename inline
      this.titleEl.addEventListener('click', () => this.startTitleEdit());
      this.titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.finishTitleEdit(); }
        if (e.key === 'Escape') { e.preventDefault(); this.cancelTitleEdit(); }
      });
      this.titleEl.addEventListener('blur', () => this.finishTitleEdit());
    },
    getActiveChat() {
      return window.App.Sidebar.chats.find(c => c.id === window.App.Sidebar.activeChatId) || null;
    },
    startTitleEdit() {
      const active = this.getActiveChat();
      if (!active) return;
      const el = this.titleEl;
      const old = el.textContent || '';
      el.contentEditable = 'true';
      el.focus();
      // place caret at end
      document.execCommand('selectAll', false, null);
      document.getSelection().collapseToEnd();
      // store original
      el.dataset.orig = old;
    },
    finishTitleEdit() {
      const el = this.titleEl;
      if (!el || el.contentEditable !== 'true') return;
      el.contentEditable = 'false';
      const val = el.textContent.trim() || 'New Chat';
      const activeId = window.App.Sidebar.activeChatId;
      window.App.Sidebar.renameChat(activeId, val);
      // re-render list
      window.App.Sidebar.render();
    },
    cancelTitleEdit() {
      const el = this.titleEl;
      if (!el || el.contentEditable !== 'true') return;
      el.textContent = el.dataset.orig || el.textContent;
      el.contentEditable = 'false';
    },
    async handleSend() {
      const text = (this.inputEl.value || '').trim();
      if (!text || this.isGenerating) return;
      const active = this.getActiveChat();
      if (!active) return;

      const userMsg = { id: String(Date.now()) + Math.random().toString(36).slice(2,6), role:'user', content:text, timestamp: nowISO() };
      window.App.Sidebar.addMessage(active.id, userMsg);
      this.inputEl.value = '';
      this.updateSendState();
      this.render();

      // if user configured chat API, call it
      const settings = window.AppSettings ? window.AppSettings.load() : {};
      if (settings && settings.chatApiUrl) {
        this.isGenerating = true;
        this.render();
        try {
          const payload = { messages: buildMessageHistoryForApi(active.messages), prompt: text };
          const headers = {'Content-Type':'application/json'};
          if (settings.chatApiKey) headers['Authorization'] = `Bearer ${settings.chatApiKey}`;

          const res = await fetch(settings.chatApiUrl, { method:'POST', headers, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error('Chat API error: ' + res.status);
          const j = await res.json();
          // prefer j.text or j.reply or j.choices[0].text for openai-like
          const reply = j.text || j.reply || (j.choices && j.choices[0] && (j.choices[0].text || j.choices[0].message && j.choices[0].message.content)) || j.output || JSON.stringify(j);
          const aiMsg = { id: String(Date.now()) + 'a', role:'assistant', content: String(reply), timestamp: nowISO() };
          window.App.Sidebar.addMessage(active.id, aiMsg);
        } catch(err){
          console.error(err);
          // fallback simulated reply on failure
          const aiMsg = { id: String(Date.now()) + 'a', role:'assistant', content: `⚠️ Error from Chat API: ${err.message}. This is a fallback simulated response.` , timestamp: nowISO() };
          window.App.Sidebar.addMessage(active.id, aiMsg);
        } finally {
          this.isGenerating = false;
          this.render();
        }
      } else {
        // simulated flow
        this.isGenerating = true;
        this.render();
        await new Promise(r=>setTimeout(r, 900 + Math.random()*500));
        const aiMsg = { id: String(Date.now()) + 'a', role:'assistant', content: `This is a demo response from Pollinations.ai. You said: "${text}".`, timestamp: nowISO() };
        window.App.Sidebar.addMessage(active.id, aiMsg);
        this.isGenerating = false;
        this.render();
      }
    },
    render() {
      const active = this.getActiveChat();
      this.titleEl.textContent = active?.title || 'New Chat';
      this.messagesArea.innerHTML = '';
      const inner = document.createElement('div');
      inner.className = 'msgs-inner';

      if (!active || active.messages.length === 0) {
        const welcome = document.createElement('div');
        welcome.className = 'w-full card-shadow rounded-xl p-10 flex flex-col items-center text-center';
        welcome.innerHTML = `
          <span class="icon-inline" id="icon-sparkles-w"></span>
          <h3 class="text-2xl font-semibold" style="background: linear-gradient(90deg,var(--c3),var(--c4)); -webkit-background-clip:text; color:transparent;">Welcome to Pollinations.ai</h3>
          <p class="text-muted max-w-xl mt-3">Start a conversation or generate images with AI. Ask anything — this demo simulates responses.</p>
        `;
        inner.appendChild(welcome);
        this.messagesArea.appendChild(inner);
        if (window.AppIcons) window.AppIcons.renderTo(document.getElementById('icon-sparkles-w'),'sparkles');
        return;
      }

      active.messages.forEach(m => {
        const row = document.createElement('div');
        row.className = 'msg-row ' + (m.role === 'user' ? 'user' : 'assistant');

        if (m.role === 'assistant') {
          const av = document.createElement('div');
          av.className = 'avatar';
          av.innerHTML = `<span class="icon-inline" id="icon-sparkles-${m.id}"></span>`;
          row.appendChild(av);
          if (window.AppIcons) window.AppIcons.renderTo(av.querySelector('.icon-inline'),'sparkles');
        }

        const bubble = document.createElement('div');
        bubble.className = 'bubble ' + (m.role === 'user' ? 'user' : 'assistant');
        bubble.setAttribute('data-id', m.id);
        // support image messages
        const contentHtml = m.image ? `<img src="${escapeHtml(m.image)}" class="rounded-md mb-2" alt="generated image" />` : `<div class="whitespace-pre-wrap text-sm">${escapeHtml(m.content)}</div>`;
        bubble.innerHTML = contentHtml + `<div class="ts">${formatTime(m.timestamp)}${m.edited ? ' • edited' : ''}</div>`;
        row.appendChild(bubble);

        if (m.role === 'user') {
          const av2 = document.createElement('div');
          av2.className = 'avatar';
          av2.innerHTML = `<span class="icon-inline" id="icon-user-${m.id}"></span>`;
          row.appendChild(av2);
          if (window.AppIcons) window.AppIcons.renderTo(av2.querySelector('.icon-inline'),'user');
          row.style.justifyContent = 'flex-end';
        }

        // double-click to edit (both assistant and user allowed)
        bubble.addEventListener('dblclick', (e) => {
          this.startEditMessage(m.id, active.id, bubble);
        });

        inner.appendChild(row);
      });

      if (this.isGenerating) {
        const tRow = document.createElement('div');
        tRow.className = 'msg-row assistant';
        const av = document.createElement('div'); av.className='avatar';
        av.innerHTML = `<span class="icon-inline"></span>`;
        tRow.appendChild(av);
        const typ = document.createElement('div'); typ.className='bubble assistant';
        typ.innerHTML = `<div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        tRow.appendChild(typ);
        inner.appendChild(tRow);
      }

      this.messagesArea.appendChild(inner);
      // ensure icons for welcome etc
      if (window.AppIcons) {
        window.AppIcons.renderTo(document.getElementById('icon-sparkles-w'),'sparkles');
      }
      // after render, scroll to bottom reliably
      requestAnimationFrame(() => { this.messagesArea.scrollTop = this.messagesArea.scrollHeight; });
      this.updateSendState();
    },
    updateSendState() {
      const val = (this.inputEl.value || '').trim();
      this.sendBtn.disabled = !val || this.isGenerating;
    },
    startEditMessage(msgId, chatId, bubbleEl) {
      // create textarea overlay inside bubble
      const original = bubbleEl.querySelector('.whitespace-pre-wrap') ? bubbleEl.querySelector('.whitespace-pre-wrap').textContent : '';
      bubbleEl.innerHTML = `<textarea class="w-full p-2 border rounded-md edit-area" rows="4">${escapeHtml(original)}</textarea>
                            <div class="flex justify-end gap-2 mt-2">
                              <button class="btn-ghost cancel-edit">Cancel</button>
                              <button class="btn-primary save-edit">Save</button>
                            </div>`;
      const save = bubbleEl.querySelector('.save-edit');
      const cancel = bubbleEl.querySelector('.cancel-edit');
      const ta = bubbleEl.querySelector('.edit-area');
      ta.focus();

      cancel.addEventListener('click', (e) => {
        this.render();
      });
      save.addEventListener('click', (e) => {
        const newVal = ta.value.trim();
        if (!newVal) { alert('Message cannot be empty'); return; }
        const success = window.App.Sidebar.updateMessage(chatId, msgId, newVal);
        if (success) this.render();
        else alert('Failed to update message');
      });
    }
  };

  function buildMessageHistoryForApi(messages){
    // map to simple array of {role, content}
    return messages.map(m => ({ role: m.role, content: m.content }));
  }

  function escapeHtml(unsafe){
    return (unsafe+'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  window.App = window.App || {};
  window.App.Chat = Chat;
})();
