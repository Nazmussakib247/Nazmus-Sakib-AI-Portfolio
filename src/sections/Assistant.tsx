import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Bot, ChevronDown, Loader2, MessageCircle, Pause, Play, Send, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import MarkdownMessage from '@/components/fx/MarkdownMessage';
import { useSettings } from '@/hooks/useSettings';
import { speakXervisText, stopXervisVoice } from '@/lib/xervisVoice';

type ChatMessage = { role: 'user' | 'assistant'; content: string; sources?: string[] };

const fallbackIntroCopy = '';
const fallbackStarterMessage = '';
const fallbackSuggestions: string[] = [];

export default function Assistant() {
  const { get, getJson } = useSettings();
  const avatarUrl = get('assistantAvatarUrl');
  const greetingAudioUrl = get('assistantGreetingAudioUrl');
  const introCopy = get('xervisIntro') || fallbackIntroCopy;
  const starterMessage = { role: 'assistant' as const, content: get('xervisStarter') || fallbackStarterMessage };
  const suggestions = getJson<string[]>('xervisSuggestions', fallbackSuggestions);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'online' | 'offline'>('online');
  const [introText, setIntroText] = useState('');
  const [showGreeting, setShowGreeting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [isGreetingPlaying, setIsGreetingPlaying] = useState(false);
  const voiceHoverActiveRef = useRef(false);
  const openRef = useRef(false);
  const voiceEnabledRef = useRef(true);
  const greetingAudioRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = trpc.assistant.chat.useMutation({
    onSuccess: (data) => {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.mode === 'ai' ? data.sources : undefined,
        },
      ]);
          setQuestion('');
          setError(null);
          setAgentStatus(data.mode === 'ai' ? 'online' : 'offline');
    },
    onError: (err) => {
      setAgentStatus('offline');
      setError(err.message || 'Xervis is temporarily unavailable.');
    },
  });

  const stopVoiceGreeting = () => {
    const audio = greetingAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsGreetingPlaying(false);
  };

  const triggerVoiceGreeting = () => {
    if (openRef.current || !voiceEnabledRef.current) return;

    const audio = greetingAudioRef.current;
    if (!audio) return;

    // Keep the media element silently warm so Chromium does not reject the
    // first hover as an untrusted unmuted autoplay attempt. Hover only
    // unmutes and rewinds the already-playing element.
    if (!audio.paused) {
      audio.loop = false;
      audio.muted = false;
      setIsGreetingPlaying(true);
      try {
        audio.currentTime = 0;
      } catch {
        // The browser will start from the beginning when the media is ready.
      }
      return;
    }

    audio.muted = true;
    audio.volume = 0;
    audio.loop = true;
    void audio.play().then(() => {
      audio.loop = false;
      audio.volume = 1;
      audio.muted = false;
      setIsGreetingPlaying(true);
      try {
        audio.currentTime = 0;
      } catch {
        // The browser will start from the beginning when the media is ready.
      }
    }).catch(() => undefined);
  };

  const handleVoiceHover = () => {
    if (voiceHoverActiveRef.current) return;
    voiceHoverActiveRef.current = true;

    // Speaker mute stops the current playback only. A fresh avatar hover
    // intentionally restores the voice so the next greeting can be heard.
    if (!voiceEnabledRef.current) {
      voiceEnabledRef.current = true;
      setVoiceEnabled(true);
    }
    triggerVoiceGreeting();
  };

  const resetVoiceHover = () => {
    voiceHoverActiveRef.current = false;
  };

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    if (!voiceEnabled) {
      stopVoiceGreeting();
      stopXervisVoice();
      setSpeakingMessageIndex(null);
    }
  }, [voiceEnabled]);

  useEffect(() => {
    const audio = greetingAudioRef.current;
    if (audio) {
      audio.defaultMuted = true;
      audio.muted = true;
      audio.volume = 0;
      audio.loop = true;
      void audio.play().catch(() => undefined);
    }

    let index = 0;
    let typingTimer: number | undefined;
    setIntroText('');

    const greetingDelayTimer = window.setTimeout(() => {
      // Start the greeting audio at the same moment the bubble begins typing.
      // Browsers may still block audible autoplay; hover remains the fallback.
      triggerVoiceGreeting();
      typingTimer = window.setInterval(() => {
        index += 1;
        const nextText = introCopy.slice(0, index);
        setIntroText(nextText);
        if (nextText.length > 0) setShowGreeting(true);
        if (index >= introCopy.length && typingTimer !== undefined) window.clearInterval(typingTimer);
      }, 26);
    }, 5200);

    const dismissTimer = window.setTimeout(() => setShowGreeting(false), 12800);
    return () => {
      window.clearTimeout(greetingDelayTimer);
      if (typingTimer !== undefined) window.clearInterval(typingTimer);
      window.clearTimeout(dismissTimer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setShowGreeting(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const toggleOpen = () => {
    setShowGreeting(false);
    stopVoiceGreeting();
    stopXervisVoice();
    setSpeakingMessageIndex(null);
    setOpen((current) => !current);
  };

  const listenToMessage = (message: ChatMessage, index: number) => {
    // A deliberate Listen click is also the recovery path after the visitor
    // has muted voice from the temporary speaker control.
    if (!voiceEnabledRef.current) {
      voiceEnabledRef.current = true;
      setVoiceEnabled(true);
    }

    if (speakingMessageIndex === index && typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      stopXervisVoice();
      setSpeakingMessageIndex(null);
      return;
    }

    const started = speakXervisText(message.content, {
      onStart: () => setSpeakingMessageIndex(index),
      onEnd: () => setSpeakingMessageIndex(null),
    });
    if (started) setSpeakingMessageIndex(index);
  };

  const toggleVoice = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setVoiceEnabled((current) => !current);
  };

  const voiceIsPlaying = speakingMessageIndex !== null || isGreetingPlaying;
  const showSpeakerControl = voiceIsPlaying;

  const sendQuestion = (event: FormEvent) => {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion || chatMutation.isPending) return;
    setError(null);
    setMessages((current) => [...current, { role: 'user', content: nextQuestion }]);
    chatMutation.mutate({ question: nextQuestion, history: messages.slice(-8) });
  };

  const askSuggestion = (value: string) => {
    if (chatMutation.isPending) return;
    setError(null);
    setMessages((current) => [...current, { role: 'user', content: value }]);
    chatMutation.mutate({ question: value, history: messages.slice(-8) });
  };

  const statusLabel = chatMutation.isPending
    ? 'Agent thinking'
    : agentStatus === 'online'
      ? 'Agent online'
      : 'Agent offline mode';

  return (
    <div
      className="xervis-widget group fixed bottom-4 right-4 z-[80] sm:bottom-7 sm:right-7"
    >
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Xervis AI Assistant"
          className="xervis-chat-panel fixed bottom-[calc(1rem+78px+0.75rem+3.5rem)] right-3 flex h-[min(520px,calc(100dvh-13rem))] w-[calc(100vw-1.5rem)] max-w-[390px] flex-col overflow-hidden rounded-[26px] border border-[#e8b923]/25 bg-[#080b17]/95 shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_45px_rgba(232,185,35,0.12)] backdrop-blur-2xl sm:bottom-[calc(1.75rem+90px+0.75rem)] sm:right-7"
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#14182a] to-[#0a0d19] px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e8b923]/30 bg-[#e8b923]/10">
                {avatarUrl && <img src={avatarUrl} alt="Xervis robot avatar" className="h-full w-full object-contain" />}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">Xervis</div>
                <div
                  className={`flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] ${agentStatus === 'online' ? 'text-green-400' : 'text-gray-500'}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${agentStatus === 'online' ? 'bg-green-400' : 'bg-gray-500'}`} />
                  {statusLabel}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopXervisVoice();
                setSpeakingMessageIndex(null);
                setOpen(false);
              }}
              aria-label="Close Xervis assistant"
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            data-lenis-prevent="true"
            onWheel={(event) => event.stopPropagation()}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#e8b923]">
              <Sparkles className="h-3 w-3" /> Ask Xervis about the work
            </div>
            {messages.map((message, index) => {
              const isSpeaking = message.role === 'assistant' && speakingMessageIndex === index;
              return (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`xervis-message-card max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-[#e8b923] text-[#05060f]' : 'rounded-bl-md border border-white/10 bg-white/[0.045] text-gray-300'} ${isSpeaking ? 'xervis-speaking-card border-[#e8b923]/55 bg-[#e8b923]/[0.07] text-gray-200' : ''}`}
                  >
                  {message.role === 'assistant' && (
                    <div className="mb-1.5 flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e8b923]">
                      <Bot className="h-3 w-3" aria-hidden="true" /> Xervis
                    </div>
                  )}
                  <div className={isSpeaking ? 'xervis-speaking-copy' : undefined}>
                    <MarkdownMessage content={message.content} tone={message.role} />
                    {isSpeaking && <span className="xervis-speaking-cursor" aria-hidden="true" />}
                  </div>
                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => listenToMessage(message, index)}
                      aria-label={
                        !voiceEnabled
                          ? 'Unmute Xervis and listen to this response'
                          : isSpeaking
                            ? 'Stop listening to this Xervis response'
                            : 'Listen to this Xervis response'
                      }
                      className={`group mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923] ${isSpeaking ? 'border-[#e8b923]/70 bg-[#e8b923]/15 text-white shadow-[0_0_18px_rgba(232,185,35,0.16)]' : 'border-white/10 bg-black/20 text-gray-400 hover:border-[#e8b923]/55 hover:bg-[#e8b923]/10 hover:text-[#f5cd45]'}`}
                    >
                      <span className={`flex h-3.5 items-center gap-[2px] ${isSpeaking ? 'text-[#f5cd45]' : 'text-[#e8b923]/70'}`} aria-hidden="true">
                        <span className="xervis-wave-bar h-1.5" />
                        <span className="xervis-wave-bar h-2.5" />
                        <span className="xervis-wave-bar h-3.5" />
                        <span className="xervis-wave-bar h-2" />
                      </span>
                      {isSpeaking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                      {!isSpeaking && <span className="text-[8px] font-normal tracking-[0.08em] text-gray-600">VOICE</span>}
                    </button>
                  )}
                  {message.sources?.length ? (
                    <div className="mt-2 border-t border-white/10 pt-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-gray-500">
                      Based on: {message.sources.join(' · ')}
                    </div>
                  ) : null}
                  </div>
                </div>
              );
            })}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => askSuggestion(suggestion)}
                    className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-gray-500 transition-colors hover:border-[#e8b923]/40 hover:text-[#e8b923] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mx-4 mb-2 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-[11px] text-red-300">{error}</p>}
          <form onSubmit={sendQuestion} className="flex items-center gap-2 border-t border-white/10 bg-[#0b0e1b] p-3">
            <input
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={get('xervisPlaceholder')}
              aria-label="Ask Xervis a question"
              maxLength={1200}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white outline-none placeholder:text-gray-600 focus:border-[#e8b923]/60 focus:ring-1 focus:ring-[#e8b923]/40"
            />
            <button
              type="submit"
              disabled={!question.trim() || chatMutation.isPending}
              aria-label="Send question to Xervis"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8b923] text-[#05060f] transition-all hover:bg-[#f5cd45] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      <video
        ref={greetingAudioRef}
        src={greetingAudioUrl}
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
        onEnded={() => setIsGreetingPlaying(false)}
        onError={() => setIsGreetingPlaying(false)}
        aria-hidden="true"
        className="sr-only"
      />

      {!open && showGreeting && introText && (
        <div className="xervis-greeting absolute bottom-[calc(100%+0.9rem+3.5rem)] right-0 w-[min(300px,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] rounded-2xl rounded-br-md border border-[#e8b923]/25 bg-[#080b17]/95 px-4 py-3 text-xs leading-relaxed text-gray-300 shadow-[0_14px_35px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-[calc(100%+0.9rem)]">
          <span className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#e8b923]">
            <Bot className="h-3 w-3" /> Xervis
          </span>
          {introText}
          <span className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 border-b border-r border-[#e8b923]/25 bg-[#080b17]" />
        </div>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        onMouseEnter={handleVoiceHover}
        onMouseMove={handleVoiceHover}
        onMouseLeave={resetVoiceHover}
        onFocus={handleVoiceHover}
        aria-label={open ? 'Close Xervis AI assistant' : 'Open Xervis AI assistant'}
        aria-expanded={open}
        className={`xervis-trigger relative flex h-[78px] w-[78px] items-center justify-center rounded-full border bg-[#080b17]/90 shadow-[0_12px_35px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923] sm:h-[90px] sm:w-[90px] ${open ? 'border-[#e8b923] shadow-[0_0_35px_rgba(232,185,35,0.28)]' : 'border-[#e8b923]/55 hover:border-[#e8b923] hover:shadow-[0_0_32px_rgba(232,185,35,0.25)]'}`}
      >
        <span className="absolute inset-1 rounded-full border border-[#e8b923]/15" />
        {chatMutation.isPending && <span className="assistant-ring absolute inset-0 rounded-full border border-[#e8b923]/70" />}
        <span className="absolute -inset-1 rounded-full border border-[#e8b923]/0 transition-all duration-500 group-hover:border-[#e8b923]/20 group-hover:scale-110" />
        <img
          src={avatarUrl}
          alt=""
          aria-hidden="true"
          className={`xervis-avatar-image relative h-[74px] w-[74px] object-contain drop-shadow-[0_0_14px_rgba(70,155,255,0.35)] sm:h-[86px] sm:w-[86px] ${chatMutation.isPending ? 'assistant-breathe' : ''}`}
        />
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#080b17] bg-[#e8b923] text-[#05060f]">
            <MessageCircle className="h-3 w-3" />
          </span>
        )}
        {open && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#080b17] bg-[#e8b923] text-[#05060f]">
            <ChevronDown className="h-3 w-3 rotate-180" />
          </span>
        )}
      </button>

      {showSpeakerControl && (
        <button
          type="button"
          onClick={toggleVoice}
          aria-pressed={!voiceEnabled}
          aria-label={voiceEnabled ? 'Mute Xervis voice' : 'Unmute Xervis voice'}
          className="absolute -left-1 -top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#080b17] bg-[#e8b923] text-[#05060f] shadow-[0_4px_16px_rgba(232,185,35,0.32),0_4px_16px_rgba(0,0,0,0.45)] transition-all duration-200 hover:scale-110 hover:bg-[#f5cd45] hover:shadow-[0_0_18px_rgba(232,185,35,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b923]"
        >
          {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      )}

      <div className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] whitespace-nowrap rounded-full border border-white/10 bg-[#080b17]/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
        {chatMutation.isPending ? 'Xervis is thinking' : 'Talk to Xervis'}
      </div>
    </div>
  );
}
