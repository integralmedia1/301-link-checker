'use client';

import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { ResultCard } from '@/components/results/result-card';
import { CrawlResults, WPCredentials } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onFix?: (linkId: string, credentials: WPCredentials) => void;
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#1f6feb] flex items-center justify-center flex-shrink-0 glow-cyan">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#0a0e14]">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8b949e]">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

export function MessageBubble({ message, onFix }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {isUser ? <UserAvatar /> : <BotAvatar />}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-[#00d9ff] text-[#0a0e14] rounded-tr-md'
            : 'bg-[#161b22] border border-[#30363d] text-[#e6e6e6] rounded-tl-md'
        )}
      >
        {message.type === 'loading' ? (
          <div className="flex items-center gap-3">
            <LoadingDots />
            <span className="text-sm text-[#8b949e]">{message.content}</span>
          </div>
        ) : message.type === 'results' && message.data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#d29922]/20 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d29922" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <p className="font-medium text-[#d29922]">{message.content}</p>
            </div>
            <div className="space-y-3">
              {(message.data as CrawlResults).redirects.map((redirect, idx) => (
                <div
                  key={redirect.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <ResultCard redirect={redirect} onFix={onFix} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className={cn(
            'whitespace-pre-wrap text-sm leading-relaxed',
            isUser ? 'font-medium' : ''
          )}>
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
