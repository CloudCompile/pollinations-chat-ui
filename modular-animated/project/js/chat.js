/* chat.js
   Responsible for messages area, sending, simulated responses, and rendering.
   Exposes Chat API on window.App.Chat
*/
(function () {
  // simple helper
  function nowISO(){ return new Date().toISOString(); }
  function formatTime(iso){
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const Chat = {
    typingTimer: null,
    isGenerating: false,
    init() {
      this.cacheDOM();
      this.bindUI();
      this.render();
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
    },
    getActiveChat() {
      const s = window.App.Sidebar;
      const id = s.activeChatId;
      return s.chats.find(c => c.id === id) || null;
    },
    handleSend() {
      const text = (this.inputEl.value || '').trim();
      if (!text || this.isGenerating) return;
      const active = this.getActiveChat();
      if (!active) return;

      const userMsg = {
        id: String(Date.now()) + Math.random().toString(36).slice(2,6),
        role: 'user',
        content: text,
        timestamp: nowISO()
      };

      // push to sidebar store
      window.App.Sidebar.addMessage(active.id, userMsg);

      // clear input
      this.inputEl.value = '';
      this.updateSendState();
      this.render();

      // simulate generation
      this.startGenerating();
      setTimeout(() => {
        const aiMsg = {
          id: String(Date.now()) + Math.random().toString(36).slice(2,6),
          role: 'assistant',
          content: `This is a demo response from Pollinations.ai. You said: "${userMsg.content}". In a real implementation this would call the API and produce image or text results.`,
          timestamp: nowISO()
        };
        window.App.Sidebar.addMessage(active.id, aiMsg);
        this.stopGenerating();
        this.render();
      }, 1050 + Math.random()*700); // above-medium, slightly variable
    },
    startGenerating() {
      this.isGenerating = true;
      this.render();
    },
    stopGenerating() {
      this.isGenerating = false;
      this.render();
    },
    render() {
      const active = this.getActiveChat();
      // update chat title
      this.titleEl.textContent = active?.title || 'New Chat';

      // messages container
      this.messagesArea.innerHTML = '';
      const inner = document.createElement('div');
      inner.className = 'msgs-inner';

      if (!active || active.messages.length === 0) {
        // welcome card
        const welcome = document.createElement('div');
        welcome.className = 'w-full card-shadow rounded-xl p-10 flex flex-col items-center text-center';
        welcome.innerHTML = `
          <svg data-lucide="sparkles" class="w-14 h-14 mb-4"></svg>
          <h3 class="text-2xl font-semibold" style="background: linear-gradient(90deg,var(--c3),var(--c4)); -webkit-background-clip:text; color:transparent;">Welcome to Pollinations.ai</h3>
          <p class="text-muted max-w-xl mt-3">Start a conversation or generate images with AI. Ask anything — this demo simulates responses.</p>
        `;
        inner.appendChild(welcome);
        this.messagesArea.appendChild(inner);
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
        return;
      }

      // render each message
      active.messages.forEach((m) => {
        const row = document.createElement('div');
        row.className = 'msg-row ' + (m.role === 'user' ? 'user' : 'assistant');

        if (m.role === 'assistant') {
          const av = document.createElement('div');
          av.className = 'avatar';
          av.innerHTML = `<svg data-lucide="sparkles" class="w-5 h-5"></svg>`;
          row.appendChild(av);
        }

        const bubble = document.createElement('div');
        bubble.className = 'bubble ' + (m.role === 'user' ? 'user' : 'assistant');
        bubble.innerHTML = `<div class="whitespace-pre-wrap text-sm">${escapeHtml(m.content)}</div>
                            <div class="ts">${formatTime(m.timestamp)}</div>`;
        row.appendChild(bubble);

        if (m.role === 'user') {
          const av2 = document.createElement('div');
          av2.className = 'avatar';
          av2.innerHTML = `<svg data-lucide="user" class="w-5 h-5"></svg>`;
          row.appendChild(av2);
          // flip bubble alignment for user
          row.style.justifyContent = 'flex-end';
        }

        inner.appendChild(row);
      });

      // typing indicator
      if (this.isGenerating) {
        const tRow = document.createElement('div');
        tRow.className = 'msg-row assistant';
        const av = document.createElement('div');
        av.className = 'avatar';
        av.innerHTML = `<svg data-lucide="sparkles" class="w-5 h-5"></svg>`;
        tRow.appendChild(av);

        const typ = document.createElement('div');
        typ.className = 'bubble assistant';
        typ.innerHTML = `<div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        tRow.appendChild(typ);
        inner.appendChild(tRow);
      }

      this.messagesArea.appendChild(inner);
      if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
      // scroll to bottom
      this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
  };

  // small escape
  function escapeHtml(unsafe){
    return (unsafe+'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  // expose
  window.App = window.App || {};
  window.App.Chat = Chat;
})();
