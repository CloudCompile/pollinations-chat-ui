// icons.js - Small internal icon set used instead of lucide
(function(){
  const icons = {
    sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"><path d="M12 3l1.5 3L16 7l-2.5 1L12 11l-1.5-3L8 7l2.5-1L12 3z"/><path d="M5 13l.9 1.8L8 16l-1.1.2L5 18l-.9-1.8L2 16l1.1-.2L4 14.8 5 13z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>`,
    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M21 15l-5-5-5 5-4-4"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 17.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.29-.34 1.51-1a1.65 1.65 0 0 0-.33-1.82L4.3 3.7A2 2 0 1 1 7.13.87l.06.06c.47.47 1.14.68 1.82.33.66-.34 1.51-.12 1.51.59V3a2 2 0 1 1 4 0v.09c0 .7.85.93 1.51.59.68-.35 1.35-.13 1.82-.33l.06-.06A2 2 0 1 1 21.7 6.1l-.06.06c-.47.47-.68 1.14-.33 1.82.34.66.12 1.51-.59 1.51H21a2 2 0 1 1 0 4h-.09c-.7 0-1.29.85-1.51 1.51z"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`
  };

  // inject icons by id convention: any element with id "icon-<name>"
  function createIcons() {
    Object.keys(icons).forEach(name => {
      const el = document.getElementById('icon-' + name);
      if (el) el.innerHTML = icons[name];
      // also allow class insertion
      const nodes = document.querySelectorAll('.icon-' + name);
      nodes.forEach(n => n.innerHTML = icons[name]);
    });
  }

  // also allow insertion via function
  window.AppIcons = {
    get(name){ return icons[name] || ''; },
    renderTo(el, name){ if (el) el.innerHTML = icons[name] || ''; }
  };

  document.addEventListener('DOMContentLoaded', createIcons);
})();
