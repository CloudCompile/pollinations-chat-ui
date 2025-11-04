// speech.js - Web Speech API Integration

(function(window) {
  'use strict';

  const Speech = {
  recognition: null,
  synthesis: null,
  isListening: false,
  isSupported: false,

  // Initialize speech recognition
  init() {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();
    this.synthesis = window.speechSynthesis;

    // Configure recognition
    this.recognition.continuous = false; // Stop after one result
    this.recognition.interimResults = true; // Get interim results
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US'; // Default language

    // Set up event handlers
    this.setupEventHandlers();

    console.log('Speech recognition initialized');
  },

  // Setup event handlers for speech recognition
  setupEventHandlers() {
    if (!this.recognition) return;

    // When speech is recognized
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update the input field
      const messageInput = document.getElementById('messageInput');
      if (messageInput) {
        if (finalTranscript) {
          // Append final transcript to existing text
          const currentText = messageInput.value;
          const newText = currentText + (currentText ? ' ' : '') + finalTranscript;
          messageInput.value = newText;
          
          // Trigger input event to resize textarea
          messageInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Show feedback
          window.UI.showToast('Speech recognized: ' + finalTranscript);
        } else if (interimTranscript) {
          // Show interim results as placeholder or visual feedback
          console.log('Interim:', interimTranscript);
        }
      }
    };

    // When recognition ends
    this.recognition.onend = () => {
      this.isListening = false;
      this.updateVoiceButtonState(false);
      console.log('Speech recognition ended');
    };

    // When recognition starts
    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateVoiceButtonState(true);
      console.log('Speech recognition started');
      window.UI.showToast('Listening... Speak now');
    };

    // Handle errors
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.updateVoiceButtonState(false);

      let errorMessage = 'Voice recognition error';
      
      switch(event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your device.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred during recognition.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      window.UI.showToast(errorMessage);
    };

    // Handle audio start
    this.recognition.onaudiostart = () => {
      console.log('Audio capturing started');
    };

    // Handle audio end
    this.recognition.onaudioend = () => {
      console.log('Audio capturing ended');
    };

    // Handle sound start
    this.recognition.onsoundstart = () => {
      console.log('Sound detected');
    };

    // Handle sound end
    this.recognition.onsoundend = () => {
      console.log('Sound ended');
    };

    // Handle speech start
    this.recognition.onspeechstart = () => {
      console.log('Speech detected');
    };

    // Handle speech end
    this.recognition.onspeechend = () => {
      console.log('Speech ended');
    };
  },

  // Start listening
  startListening() {
    if (!this.isSupported) {
      window.UI.showToast('Speech recognition not supported in this browser');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      window.UI.showToast('Failed to start voice recognition');
    }
  },

  // Stop listening
  stopListening() {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  },

  // Toggle listening
  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  },

  // Update voice button visual state
  updateVoiceButtonState(isActive) {
    const voiceBtn = document.getElementById('voiceBtn');
    if (!voiceBtn) return;

    if (isActive) {
      voiceBtn.classList.add('listening');
      voiceBtn.title = 'Stop listening';
      
      // Change icon color or add animation
      voiceBtn.style.color = '#ef4444'; // Red when active
    } else {
      voiceBtn.classList.remove('listening');
      voiceBtn.title = 'Voice input';
      voiceBtn.style.color = '';
    }
  },

  // Set language for recognition
  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
      console.log('Speech recognition language set to:', lang);
    }
  },

  // Text-to-speech: speak a message
  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Stop any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    utterance.lang = options.lang || 'en-US';

    // Event handlers
    utterance.onend = () => {
      console.log('Speech finished');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
    };

    // Speak
    this.synthesis.speak(utterance);
  },

  // Stop speaking
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  },

  // Get available voices
  getVoices() {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  },

  // Check if currently speaking
  isSpeaking() {
    return this.synthesis && this.synthesis.speaking;
  }
  };

  // Export for use in other modules
  window.Speech = Speech;
})(window);
