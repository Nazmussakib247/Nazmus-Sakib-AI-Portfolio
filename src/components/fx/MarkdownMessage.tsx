import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownMessageProps = {
  content: string;
  tone?: 'assistant' | 'user';
};

function MarkdownMessage({ content, tone = 'assistant' }: MarkdownMessageProps) {
  const isUser = tone === 'user';
  const bodyText = isUser ? 'text-[#05060f]' : 'text-gray-300';
  const strongText = isUser ? 'text-[#05060f]' : 'text-white';
  const mutedText = isUser ? 'text-[#172033]/80' : 'text-gray-400';
  const accentText = isUser ? 'text-[#172033]' : 'text-[#f5cd45]';

  return (
    <div className={`xervis-markdown text-xs leading-[1.65] ${bodyText}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className={`font-bold ${strongText}`}>{children}</strong>,
          em: ({ children }) => <em className={`italic ${mutedText}`}>{children}</em>,
          h1: ({ children }) => <h3 className={`mb-2 mt-3 text-sm font-bold ${strongText} first:mt-0`}>{children}</h3>,
          h2: ({ children }) => <h3 className={`mb-2 mt-3 text-sm font-bold ${strongText} first:mt-0`}>{children}</h3>,
          h3: ({ children }) => (
            <h4 className={`mb-1.5 mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] ${accentText} first:mt-0`}>
              {children}
            </h4>
          ),
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-1 marker:text-[#e8b923]">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className={`my-2 border-l-2 border-[#e8b923]/60 pl-3 ${mutedText}`}>{children}</blockquote>
          ),
          hr: () => <hr className={`my-3 ${isUser ? 'border-[#05060f]/15' : 'border-white/10'}`} />,
          a: ({ href, children }) =>
            href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-semibold underline decoration-[#e8b923]/50 underline-offset-2 transition-colors hover:opacity-70 ${accentText}`}
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          pre: ({ children }) => (
            <pre
              className={`my-2 overflow-x-auto rounded-xl border p-3 text-[10px] leading-relaxed ${
                isUser
                  ? 'border-[#05060f]/10 bg-black/10 text-[#05060f]'
                  : 'border-white/10 bg-black/30 text-cyan-100'
              }`}
            >
              {children}
            </pre>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className?.includes('language-')) || String(children).includes('\n');
            return isBlock ? (
              <code className={className}>{children}</code>
            ) : (
              <code
                className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${
                  isUser
                    ? 'border-[#05060f]/10 bg-black/10 text-[#05060f]'
                    : 'border-white/10 bg-black/25 text-cyan-200'
                }`}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownMessage);
