/* images.js - Image generation UI & API flow.
   Uses settings stored in AppSettings.
*/
(function(){
  function createImageModal(){
    const root = document.getElementById('modalRoot');
    const modalId = 'imageModal';
    // ensure not duplicated
    if (document.getElementById(modalId)) return;

    const html = `
      <div id="${modalId}" class="modal fixed inset-0 z-50 flex items-center justify-center">
        <div class="modal-backdrop fixed inset-0 bg-black/35 backdrop-blur-sm"></div>
        <div class="modal-card bg-white rounded-xl p-6 z-50 w-full max-w-3xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Generate Image</h3>
            <button id="imageClose" class="icon-btn" aria-label="Close"><span class="icon-inline" id="icon-close-img"></span></button>
          </div>

          <div class="space-y-4">
            <label class="block text-xs text-muted">Prompt</label>
            <textarea id="imagePrompt" class="input-field w-full" rows="3" placeholder="Describe the image you want..."></textarea>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-muted">Width</label>
                <input id="imageWidth" class="input-field w-full" placeholder="512" value="1024" />
              </div>
              <div>
                <label class="block text-xs text-muted">Height</label>
                <input id="imageHeight" class="input-field w-full" placeholder="512" value="1024" />
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-4">
              <button id="imageGenerate" class="btn-primary">Generate</button>
            </div>

            <div id="imageResult" class="mt-4"></div>
          </div>
        </div>
      </div>
    `;
    root.insertAdjacentHTML('beforeend', html);
    // icons
    if (window.AppIcons) {
      window.AppIcons.renderTo(document.getElementById('icon-close-img'),'close');
    }
    hookImageModal();
  }

  function hookImageModal(){
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    const close = document.getElementById('imageClose');
    const genBtn = document.getElementById('imageGenerate');
    const promptEl = document.getElementById('imagePrompt');
    const wEl = document.getElementById('imageWidth');
    const hEl = document.getElementById('imageHeight');
    const result = document.getElementById('imageResult');

    close.addEventListener('click', () => modal.remove());

    genBtn.addEventListener('click', async () => {
      const prompt = promptEl.value.trim();
      if (!prompt) {
        alert('Please provide a prompt.');
        return;
      }
      genBtn.disabled = true;
      genBtn.textContent = 'Generating...';

      // load settings for API
      const s = window.AppSettings.load ? window.AppSettings.load() : {};
      const apiUrl = s.imageApiUrl || '';
      const apiKey = s.imageApiKey || '';
      const respKey = s.imageResponseKey || 'image';

      try {
        let imageUrl = null;
        if (apiUrl) {
          // call real API (POST JSON)
          const body = { prompt, width: parseInt(wEl.value||1024), height: parseInt(hEl.value||1024) };
          const headers = { 'Content-Type':'application/json' };
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

          const r = await fetch(apiUrl, { method:'POST', headers, body: JSON.stringify(body) });
          if (!r.ok) throw new Error('Image API returned ' + r.status);
          const json = await r.json();
          // support nested response: respKey may be 'data.0.url' etc
          imageUrl = nestedGet(json, respKey) || json[respKey] || json.image || null;
        } else {
          // simulate image for demo
          imageUrl = 'https://picsum.photos/' + (wEl.value||1024) + '/' + (hEl.value||1024) + '?random=' + Math.floor(Math.random()*1000);
          // small delay to feel real
          await new Promise(r=>setTimeout(r, 900));
        }

        if (!imageUrl) throw new Error('No image url found in response (check "imageResponseKey" settings).');

        // render result
        result.innerHTML = `
          <div class="rounded-lg overflow-hidden border p-2">
            <img src="${escapeHtml(imageUrl)}" alt="Generated" class="w-full rounded-md" />
            <div class="flex items-center justify-between mt-2">
              <a class="btn-ghost" href="${escapeHtml(imageUrl)}" download>Download</a>
              <button id="insertToChat" class="btn-accent">Insert into Chat</button>
            </div>
          </div>
        `;
        // insert to chat action
        document.getElementById('insertToChat').addEventListener('click', () => {
          // insert message containing image and persist in current chat
          const activeId = window.App.Sidebar.activeChatId;
          if (!activeId) return alert('No active chat selected.');
          const msg = {
            id: String(Date.now()) + Math.random().toString(36).slice(2,6),
            role: 'assistant',
            content: `![image](${imageUrl})`,
            image: imageUrl,
            timestamp: new Date().toISOString()
          };
          window.App.Sidebar.addMessage(activeId, msg);
          // close modal and re-render
          modal.remove();
          window.App.Chat.render();
        });

      } catch(err){
        console.error(err);
        alert('Image generation failed: ' + (err.message || err));
      } finally {
        genBtn.disabled = false;
        genBtn.textContent = 'Generate';
      }
    });
  }

  function nestedGet(obj, path){
    if (!path) return null;
    const parts = path.split('.');
    let cur = obj;
    for (let p of parts){
      if (cur == null) return null;
      if (p.endsWith(']')) {
        // handle array idx like data[0]
        const m = p.match(/(.+)\[(\d+)\]$/);
        if (m) {
          cur = cur[m[1]];
          cur = cur && cur[parseInt(m[2])];
          continue;
        }
      }
      cur = cur[p];
    }
    return cur;
  }

  function escapeHtml(s){ return (s+'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

  // wire up button
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('imgFlowBtn');
    if (btn) btn.addEventListener('click', () => {
      createImageModal();
    });

    // ensure icon exists
    if (window.AppIcons) window.AppIcons.renderTo(document.getElementById('icon-image'),'image');
  });
})();
