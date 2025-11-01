import { useState, useEffect, useCallback } from 'react';

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      setSpeechRecognition(recognition);
    }
  }, []);

  const startListening = useCallback((onResult) => {
    if (speechRecognition && !isListening) {
      speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };
      speechRecognition.onend = () => {
        setIsListening(false);
      };
      speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      speechRecognition.start();
      setIsListening(true);
    }
  }, [speechRecognition, isListening]);

  const stopListening = useCallback(() => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
      setIsListening(false);
    }
  }, [speechRecognition, isListening]);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    hasSpeechRecognition: !!speechRecognition,
  };
};
