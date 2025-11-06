(function () {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.continuous = false;

  // Helpers to keep typed text separate from interim display
  function getInputEl() {
    return document.querySelector('#messageInput') || document.querySelector('.message-input') || null;
  }

  function saveUserTyped(inputEl) {
    // store the user's manually typed text separately so we don't overwrite it
    if (!inputEl) return;
    inputEl.dataset.userTyped = inputEl.dataset.userTyped || inputEl.value || '';
  }

  recognition.onstart = () => {
    document.documentElement.classList.add('speech-listening');
    // If the user clicks mic, capture the current typed value
    const inputEl = getInputEl();
    if (inputEl) saveUserTyped(inputEl);
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const t = res[0].transcript || '';
      if (res.isFinal) finalTranscript += t;
      else interimTranscript += t;
    }

    const inputEl = getInputEl();
    if (!inputEl) return;

    // Preserve user's typed value separately (so typing while listening doesn't get lost)
    inputEl.dataset.userTyped = inputEl.dataset.userTyped || inputEl.value || '';

    if (finalTranscript) {
      // Commit final transcript to the input (append)
      const userTyped = (inputEl.dataset.userTyped || '').trim();
      const combined = [userTyped, finalTranscript.trim()].filter(Boolean).join(' ').trim();
      inputEl.value = combined;
      // Clear interim and stored typed text so subsequent typing behaves normally
      delete inputEl.dataset.interim;
      delete inputEl.dataset.userTyped;
      // Optionally trigger send if your UI auto-sends; otherwise user can edit/send
      // Example: window.sendMessage?.(); // uncomment if you auto-send
    } else {
      // Show interim without committing it to userTyped
      inputEl.dataset.interim = interimTranscript.trim();
      const userTyped = (inputEl.dataset.userTyped || '').trim();
      inputEl.value = [userTyped, interimTranscript.trim()].filter(Boolean).join(' ').trim();
    }
  };

  recognition.onend = () => {
    document.documentElement.classList.remove('speech-listening');
    const inputEl = getInputEl();
    if (!inputEl) return;
    // Sometimes no final fires — ensure any remaining interim becomes part of the input
    if (inputEl.dataset.interim) {
      const userTyped = (inputEl.dataset.userTyped || '').trim();
      inputEl.value = [userTyped, inputEl.dataset.interim].filter(Boolean).join(' ').trim();
      delete inputEl.dataset.interim;
      delete inputEl.dataset.userTyped;
    } else {
      // cleanup stored typed text
      delete inputEl.dataset.userTyped;
    }
  };

  recognition.onerror = (e) => {
    console.warn('Speech recognition error:', e);
    document.documentElement.classList.remove('speech-listening');
  };

  // Expose start/stop helpers to global so UI can call them
  window.startSpeechRecognition = function () {
    try {
      recognition.start();
    } catch (err) {
      console.warn('Speech start error:', err);
    }
  };

  window.stopSpeechRecognition = function () {
    try {
      recognition.stop();
    } catch (err) {
      console.warn('Speech stop error:', err);
    }
  };
})();
