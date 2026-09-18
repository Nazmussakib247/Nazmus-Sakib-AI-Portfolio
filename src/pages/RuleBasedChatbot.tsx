import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Bot, RotateCcw, Send, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router';

type Message = {
  id: number;
  role: 'bot' | 'user';
  text: string;
};

const quickPrompts = ['Hello', 'What can you do?', 'Tell me a joke', 'What is AI?'];

function getBotResponse(input: string): string {
  const normalized = input.trim().toLowerCase();

  // Project 1 requirement: deterministic if-else decision-making rules.
  if (!normalized) {
    return 'Please type a message so I can respond.';
  } else if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(normalized)) {
    return 'Hello! I’m Logic-01, a rule-based chatbot. How can I help you today?';
  } else if (/\b(how are you|how do you feel)\b/.test(normalized)) {
    return 'I’m running smoothly and ready to chat. Thanks for asking!';
  } else if (/\b(what can you do|help|capabilities|功能)\b/.test(normalized)) {
    return 'I can greet you, explain basic AI concepts, share a joke, tell the time, and end our session when you say goodbye.';
  } else if (/\b(joke|funny)\b/.test(normalized)) {
    return 'Why did the programmer bring a ladder? Because the bugs were on the next level.';
  } else if (/\b(what is ai|artificial intelligence|machine learning)\b/.test(normalized)) {
    return 'Artificial intelligence is the field of building systems that perform tasks that normally require human intelligence. I am a simpler kind: my responses are chosen by explicit rules.';
  } else if (/\b(time|clock)\b/.test(normalized)) {
    return `The current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
  } else if (/\b(thank you|thanks)\b/.test(normalized)) {
    return 'You’re welcome! Try another question or say goodbye whenever you’re ready.';
  } else if (/\b(bye|goodbye|exit|quit|see you)\b/.test(normalized)) {
    return 'Goodbye! Thanks for testing Logic-01. You can restart the conversation whenever you like.';
  } else {
    return 'I’m still learning the rules for that one. Try asking about AI, my capabilities, a joke, or the time.';
  }
}

export default function RuleBasedChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'bot', text: 'Hello! I’m Logic-01, your rule-based AI chatbot. Say hello to begin.' },
  ]);
  const [input, setInput] = useState('');
  const [nextId, setNextId] = useState(2);

  const ruleCount = useMemo(() => 9, []);

  function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMessage: Message = { id: nextId, role: 'user', text };
    const botMessage: Message = { id: nextId + 1, role: 'bot', text: getBotResponse(text) };
    setMessages((current) => [...current, userMessage, botMessage]);
    setNextId((current) => current + 2);
    setInput('');
  }

  function resetChat() {
    setMessages([{ id: 1, role: 'bot', text: 'Conversation reset. Hello again! What would you like to explore?' }]);
    setNextId(2);
    setInput('');
  }

  return (
    <main className="min-h-screen bg-[#05060f] px-4 py-6 text-white sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-gray-500 transition-colors hover:text-[#e8b923]">
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          <div className="flex flex-col justify-between rounded-3xl border border-[#e8b923]/20 bg-gradient-to-br from-[#171325] via-[#0d1020] to-[#080914] p-7 sm:p-10">
            <div>
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e8b923]/30 bg-[#e8b923]/10 text-[#e8b923] shadow-[0_0_36px_rgba(232,185,35,0.12)]">
                <Bot className="h-7 w-7" />
              </div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#e8b923]">Project 01 / Industrial Training Kit</p>
              <h1 className="max-w-lg text-4xl font-medium leading-[1.04] text-gradient-gold sm:text-6xl">Rule-Based AI Chatbot</h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-gray-400">A deterministic conversational interface powered by explicit if-else rules, a continuous message loop, and carefully defined fallback behavior.</p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Decision rules</p><p className="mt-2 text-2xl text-[#e8b923]">{ruleCount}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Mode</p><p className="mt-2 text-2xl text-cyan-300">Live</p></div>
            </div>
          </div>

          <div className="glass flex min-h-[620px] flex-col overflow-hidden rounded-3xl">
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Sparkles className="h-4 w-4" /></span><div><p className="text-sm font-medium">Logic-01</p><p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">● Online · rule engine active</p></div></div>
              <button type="button" onClick={resetChat} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-400 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]" aria-label="Reset chat"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-7" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-end gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'bot' && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8b923]/10 text-[#e8b923]"><Bot className="h-4 w-4" /></span>}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-sm bg-[#e8b923] text-[#05060f]' : 'rounded-bl-sm border border-white/10 bg-white/[0.045] text-gray-300'}`}>{message.text}</div>
                  {message.role === 'user' && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><UserRound className="h-4 w-4" /></span>}
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-5 sm:p-7">
              <div className="mb-4 flex flex-wrap gap-2">{quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => { setInput(prompt); }} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-[#e8b923]/50 hover:text-[#e8b923]">{prompt}</button>)}</div>
              <form onSubmit={sendMessage} className="flex gap-2">
                <label htmlFor="chat-message" className="sr-only">Type a message</label>
                <input id="chat-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a message…" autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#e8b923]/60" />
                <button type="submit" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8b923] text-[#05060f] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40" disabled={!input.trim()} aria-label="Send message"><Send className="h-4 w-4" /></button>
              </form>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-gray-600">Try “goodbye” to test the exit command</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export { getBotResponse };
