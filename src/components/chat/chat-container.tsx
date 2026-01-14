'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble } from './message-bubble';
import { InputArea } from './input-area';
import { useChatState } from '@/hooks/use-chat-state';

export function ChatContainer() {
  const { messages, isLoading, startCrawl, fixLink } = useChatState();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat area with subtle grid pattern */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Welcome hero when no messages yet */}
          {messages.length === 1 && (
            <div className="text-center mb-12 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#21262d] border border-[#30363d] mb-6">
                <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" />
                <span className="text-xs font-mono text-[#8b949e] uppercase tracking-wider">
                  Powered by Screaming Frog
                </span>
              </div>
              <h1 className="text-4xl font-semibold text-[#e6e6e6] mb-4 tracking-tight">
                Find & Fix{' '}
                <span className="text-[#00d9ff] text-glow">301 Redirects</span>
              </h1>
              <p className="text-[#8b949e] max-w-md mx-auto text-lg leading-relaxed">
                Enter any website URL to scan for broken redirect links.
                Auto-fix WordPress sites with one click.
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <MessageBubble message={message} onFix={fixLink} />
              </div>
            ))}
          </div>

          {/* Scroll padding */}
          <div className="h-8" />
        </div>
      </div>

      {/* Input area */}
      <InputArea onSubmit={startCrawl} disabled={isLoading} />
    </div>
  );
}
