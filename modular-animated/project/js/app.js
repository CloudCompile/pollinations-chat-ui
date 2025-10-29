/* app.js
   Bootstraps the app and manages global UI behaviors (sidebar toggle, keyboard shortcuts).
*/
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // initialize modules
    if (window.App && window.App.Sidebar && window.App.Chat) {
      window.App.Sidebar.init();
      window.App.Chat.init();
    } else {
      console.error('Modules missing: ensure sidebar.js and chat.js are loaded.');
    }

    // create icons
    if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();

    // sidebar toggle
    const toggle = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    toggle.addEventListener('click', () => {
      if (sidebar.style.width && sidebar.style.width !== '') {
        // collapse
        sidebar.style.width = '68px';
        sidebar.classList.add('sidebar-collapsed');
      } else {
        sidebar.style.width = '';
        sidebar.classList.remove('sidebar-collapsed');
      }
    });

    // keyboard shortcut: Ctrl/Cmd+K focus input
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        input.focus();
      }
    });

    // ensure send button enabled state initially
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
    });
  });
})();
