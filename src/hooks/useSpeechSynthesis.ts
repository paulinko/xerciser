import { useCallback, useEffect, useState } from 'react';

export function useSpeechSynthesis() {
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const currentSynth = window.speechSynthesis;
      setSynth(currentSynth);

      const loadVoices = () => {
        const availableVoices = currentSynth.getVoices();
        setVoices(availableVoices);
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

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if (synth && text) {
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
    }
  }, [synth, voices]);

  return { speak, isSupported: !!synth };
}