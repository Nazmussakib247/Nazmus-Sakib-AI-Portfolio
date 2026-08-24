const XERVIS_GREETING = "Hi, I’m Xervis, Nazmus Sakib’s AI Assistant. How can I help you today?";

type VoiceCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
};

function pickVoice(voices: SpeechSynthesisVoice[], language: string) {
  const languagePrefix = language.toLowerCase().split('-')[0];
  const deepVoice = /david|mark|guy|daniel|alex|google us english|microsoft|natural|neural/i;
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix) && deepVoice.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ??
    voices[0]
  );
}

function cleanTextForSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/^\s*[-+•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopXervisVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakXervisText(text: string, callbacks: VoiceCallbacks = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    return false;
  }

  const spokenText = cleanTextForSpeech(text);
  if (!spokenText) return false;

  const isBangla = /[\u0980-\u09FF]/.test(spokenText);
  const language = isBangla ? 'bn-BD' : 'en-US';
  const synthesis = window.speechSynthesis;
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.lang = language;
  utterance.rate = isBangla ? 0.9 : 0.86;
  utterance.pitch = 0.46;
  utterance.volume = 0.92;
  utterance.onstart = callbacks.onStart ?? null;
  utterance.onend = callbacks.onEnd ?? null;
  utterance.onerror = callbacks.onEnd ?? null;

  const voices = synthesis.getVoices();
  const voice = pickVoice(voices, language);
  if (voice) utterance.voice = voice;

  synthesis.speak(utterance);
  return true;
}

export function speakXervisGreeting(callbacks: VoiceCallbacks = {}) {
  return speakXervisText(XERVIS_GREETING, callbacks);
}
