import { useCallback, useEffect, useState } from 'react';

export function useSpeechSynthesis() {
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const currentSynth = window.speechSynthesis;
      setSynth(currentSynth);

      const loadVoices = () => {
        const availableVoices = currentSynth.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0) {
          setIsReady(true); // Mark as ready once voices are loaded
        }
      };

      // Load voices immediately if they are already available
      if (currentSynth.getVoices().length > 0) {
        loadVoices();
      } else {
        // Otherwise, wait for the voiceschanged event
        currentSynth.addEventListener('voiceschanged', loadVoices);
      }

      return () => {
        currentSynth.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  // Function to attempt to activate speech synthesis with a user gesture
  const requestSpeechPermission = useCallback(() => {
    if (synth && !synth.speaking && isReady) {
      const utterance = new SpeechSynthesisUtterance(""); // Silent utterance
      utterance.volume = 0; // Make it truly silent
      synth.speak(utterance);
      // Immediately cancel to not block other speech
      synth.cancel();
    }
  }, [synth, isReady]);

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if (synth && isReady && text) { // Ensure synth is ready
      // Cancel any ongoing speech to prevent queuing issues, especially on mobile
      synth.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      // Try to find a suitable voice, prioritizing English voices
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0]; // Use the first available English voice
      } else if (voices.length > 0) {
        utterance.voice = voices[0]; // Fallback to any available voice
      }

      synth.speak(utterance);
    } else if (!isReady) {
      console.warn("Speech synthesis not ready. Voices might not be loaded yet.");
    }
  }, [synth, voices, isReady]); // Add isReady to dependencies

  return { speak, isSupported: !!synth, isReady, requestSpeechPermission }; // Expose requestSpeechPermission
}