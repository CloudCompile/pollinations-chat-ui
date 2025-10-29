/* app.js - initializes everything and binds global UI */
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    if (window.App && window.App.Sidebar && window.App.Chat) {
      window.App.Sidebar.init();
      window.App.Chat.init();
    } else {
      console.error('Modules missing: ensure sidebar.js and chat.js are loaded.');
    }

    // icons previously inlined by icons.js; ensure top-level icons
    // render icons in header etc
    if (window.AppIcons) {
      window.AppIcons.renderTo(document.getElementById('icon-menu'),'menu');
      window.AppIcons.renderTo(document.getElementById('icon-plus'),'plus');
      window.AppIcons.renderTo(document.getElementById('icon-sparkles'),'sparkles');
      window.AppIcons.renderTo(document.getElementById('icon-image'),'image');
      window.AppIcons.renderTo(document.getElementById('icon-settings'),'settings');
      window.AppIcons.renderTo(document.getElementById('icon-user'),'user');
      window.AppIcons.renderTo(document.getElementById('icon-send'),'send');
    }

    // sidebar toggle that uses data-collapsed attr
    const toggle = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    toggle.addEventListener('click', () => {
      const collapsed = sidebar.getAttribute('data-collapsed') === 'true';
      if (collapsed) {
        sidebar.setAttribute('data-collapsed','false');
        sidebar.style.width = '';
      } else {
        sidebar.setAttribute('data-collapsed','true');
        sidebar.style.width = '68px';
      }
    });

    // img flow button (make sure icon exists)
    const imgBtn = document.getElementById('imgFlowBtn');
    if (imgBtn && window.AppIcons) window.AppIcons.renderTo(document.getElementById('icon-image'),'image');

    // settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      window.AppSettings = window.AppSettings || {};
      // open settings handled by settings.js
    }

    // theme shortcut: click themeBtn cycles modes
    const themeBtn = document.getElementById('themeBtn');
    themeBtn.addEventListener('click', () => {
      const s = window.AppSettings.load ? window.AppSettings.load() : {};
      const cur = s.theme || 'light';
      const order = ['light','dark','high-contrast'];
      const next = order[(order.indexOf(cur)+1) % order.length];
      s.theme = next;
      window.AppSettings.save(s);
      document.dispatchEvent(new CustomEvent('settings:changed', { detail: s }));
      // apply immediately
      if (next === 'dark') document.documentElement.classList.add('theme-dark');
      else document.documentElement.classList.remove('theme-dark');
      if (next === 'high-contrast') document.documentElement.classList.add('theme-high-contrast');
      else document.documentElement.classList.remove('theme-high-contrast');
      alert('Theme set to ' + next + '. You can refine in Settings.');
    });

    // Ctrl/Cmd+K focuses input
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        input.focus();
      }
      // quick new chat: Ctrl/Cmd+N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        document.getElementById('newChatBtn').click();
      }
    });

    // ensure send button reflects input state initially
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    function updateInitialSend(){
      sendBtn.disabled = !(input.value && input.value.trim().length>0);
    }
    updateInitialSend();
    input.addEventListener('input', updateInitialSend);

  });
})();
