/* settings.js
   Basic settings modal to configure:
   - chatApiUrl, chatApiKey
   - imageApiUrl, imageApiKey
   - theme (light/dark/high-contrast)
   - image response mapping key (default 'image')
*/
(function(){
  const STORAGE = 'pollinations_settings_v1';

  function loadSettings(){
    try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); }
    catch(e){ return {}; }
  }

  function saveSettings(s){
    localStorage.setItem(STORAGE, JSON.stringify(s||{}));
  }

  function buildModal(){
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div id="settingsModal" class="modal hidden fixed inset-0 z-50 flex items-center justify-center">
        <div class="modal-backdrop fixed inset-0 bg-black/35 backdrop-blur-sm"></div>
        <div class="modal-card bg-white rounded-xl p-6 z-50 w-full max-w-2xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Settings</h3>
            <button id="settingsClose" class="icon-btn" aria-label="Close">
              <span class="icon-inline" id="icon-close"></span>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs text-muted mb-1">Chat API URL</label>
              <input id="chatApiUrl" class="input-field w-full" placeholder="https://your-chat-api.example/endpoint" />
              <p class="text-xs text-muted mt-1">If set, assistant messages will be fetched from this endpoint. Example: OpenAI or your own service.</p>
            </div>

            <div>
              <label class="block text-xs text-muted mb-1">Chat API Key</label>
              <input id="chatApiKey" class="input-field w-full" placeholder="API key (optional)" />
            </div>

            <div>
              <label class="block text-xs text-muted mb-1">Image API URL</label>
              <input id="imageApiUrl" class="input-field w-full" placeholder="https://api.pollinations.ai/generate" />
              <p class="text-xs text-muted mt-1">If set, image generation will call this endpoint. Response is expected to include JSON with an image URL (e.g. { image: 'https://...' }).</p>
            </div>

            <div>
              <label class="block text-xs text-muted mb-1">Image API Key</label>
              <input id="imageApiKey" class="input-field w-full" placeholder="API key (optional)" />
            </div>

            <div>
              <label class="block text-xs text-muted mb-1">Image response field</label>
              <input id="imageResponseKey" class="input-field w-full" placeholder="image" />
              <p class="text-xs text-muted mt-1">Key in JSON which contains the generated image URL (default: <code>image</code>).</p>
            </div>

            <div>
              <label class="block text-xs text-muted mb-1">Theme</label>
              <select id="themeSelect" class="input-field w-full">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="high-contrast">High contrast</option>
              </select>
            </div>

            <div class="flex items-center justify-end gap-3 mt-4">
              <button id="settingsSave" class="btn-primary">Save</button>
              <button id="settingsCancel" class="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    // render inline icons
    if (window.AppIcons) {
      window.AppIcons.renderTo(document.getElementById('icon-close'),'close');
    }
    hookModal();
  }

  function hookModal(){
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const close = document.getElementById('settingsClose');
    const save = document.getElementById('settingsSave');
    const cancel = document.getElementById('settingsCancel');

    const chatApiUrl = document.getElementById('chatApiUrl');
    const chatApiKey = document.getElementById('chatApiKey');
    const imageApiUrl = document.getElementById('imageApiUrl');
    const imageApiKey = document.getElementById('imageApiKey');
    const imageResponseKey = document.getElementById('imageResponseKey');
    const themeSelect = document.getElementById('themeSelect');

    const s = loadSettings();
    chatApiUrl.value = s.chatApiUrl || '';
    chatApiKey.value = s.chatApiKey || '';
    imageApiUrl.value = s.imageApiUrl || '';
    imageApiKey.value = s.imageApiKey || '';
    imageResponseKey.value = s.imageResponseKey || 'image';
    themeSelect.value = s.theme || 'light';

    settingsBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
    close.addEventListener('click', () => modal.classList.add('hidden'));
    cancel.addEventListener('click', () => modal.classList.add('hidden'));

    save.addEventListener('click', () => {
      const newS = {
        chatApiUrl: chatApiUrl.value.trim(),
        chatApiKey: chatApiKey.value.trim(),
        imageApiUrl: imageApiUrl.value.trim(),
        imageApiKey: imageApiKey.value.trim(),
        imageResponseKey: imageResponseKey.value.trim() || 'image',
        theme: themeSelect.value
      };
      saveSettings(newS);
      // apply theme immediately
      applyTheme(newS.theme);
      modal.classList.add('hidden');
      // notify other modules
      document.dispatchEvent(new CustomEvent('settings:changed', { detail: newS }));
    });
  }

  function applyTheme(theme){
    document.documentElement.classList.remove('theme-dark','theme-high-contrast');
    if (theme === 'dark') document.documentElement.classList.add('theme-dark');
    if (theme === 'high-contrast') document.documentElement.classList.add('theme-high-contrast');
    saveSettings(loadSettings()); // ensure saved (applied by the user save)
  }

  // bootstrap
  document.addEventListener('DOMContentLoaded', () => {
    buildModal();
    const s = loadSettings();
    if (s.theme) applyTheme(s.theme);
  });

  // public helpers
  window.AppSettings = {
    load: loadSettings,
    save: saveSettings
  };
})();
