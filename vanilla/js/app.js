// js/app.js
// Adds image size validation, case-insensitive model search, and theme accent active state.
// Merge these handlers with the existing UI initialization code.

(function () {
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

  // IMAGE UPLOAD: validate type + size, then forward to existing image handling
  const imageFileInput = document.querySelector('#imageFileInput') || document.querySelector('input[type="file"].image-upload');
  if (imageFileInput) {
    imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        imageFileInput.value = '';
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        alert('Image is too large. Please select an image under 5 MB.');
        imageFileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result;
        // Hook: addImageMessageToInputOrChat should exist in your codebase or replace with your handler
        if (typeof window.addImageMessageToInputOrChat === 'function') {
          window.addImageMessageToInputOrChat({ filename: file.name, size: file.size, dataUrl });
        } else {
          // fallback: add image message directly if you have addMessage API
          const chatId = window.currentChatId || null;
          if (chatId && typeof window.addMessage === 'function') {
            const message = { role: 'user', content: [{ type: 'image_url', image_url: { url: dataUrl } }] };
            window.addMessage(chatId, message);
          } else {
            console.warn('No image handler found — please implement addImageMessageToInputOrChat or addMessage.');
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // MODEL SEARCH: case-insensitive
  const modelSearchInput = document.querySelector('#modelSearch') || document.querySelector('.model-search input');
  if (modelSearchInput) {
    modelSearchInput.addEventListener('input', (e) => {
      const term = (e.target.value || '').toLowerCase().trim();
      const modelItems = document.querySelectorAll('.model-item');
      modelItems.forEach((item) => {
        const name = (item.dataset.modelName || item.textContent || '').toLowerCase();
        item.style.display = name.includes(term) ? '' : 'none';
      });
    });
  }

  // THEME ACCENT: active state visual persistence
  const accentButtons = document.querySelectorAll('.accent-choice');
  if (accentButtons && accentButtons.length > 0) {
    accentButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        accentButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const accent = e.currentTarget.dataset.accent;
        if (typeof window.applyAccent === 'function') {
          window.applyAccent(accent);
        } else {
          // simple fallback: set CSS variable and save to localStorage
          document.documentElement.style.setProperty('--accent-color', accent || '');
          localStorage.setItem('chat-accent', accent || '');
        }
      });
    });
    // On load: apply saved accent and active state
    const savedAccent = localStorage.getItem('chat-accent');
    if (savedAccent) {
      const btn = Array.from(accentButtons).find(b => b.dataset.accent === savedAccent);
      if (btn) btn.classList.add('active');
      if (typeof window.applyAccent === 'function') window.applyAccent(savedAccent);
      else document.documentElement.style.setProperty('--accent-color', savedAccent);
    }
  }
})();
