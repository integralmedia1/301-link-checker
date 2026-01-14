'use client';

import { useState, useCallback } from 'react';
import { Message, CrawlResults, FixResult } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: 'Welcome! Enter a website URL to scan for 301 redirect links.',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [crawlId, setCrawlId] = useState<string | null>(null);
  const [results, setResults] = useState<CrawlResults | null>(null);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const startCrawl = useCallback(
    async (url: string) => {
      // Add user message
      addMessage({
        role: 'user',
        content: url,
        type: 'text',
      });

      // Add loading message
      const loadingId = addMessage({
        role: 'assistant',
        content: `Scanning ${url} for 301 redirects...`,
        type: 'loading',
      });

      setIsLoading(true);

      try {
        // Start crawl
        const response = await fetch('/api/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteUrl: url }),
        });

        if (!response.ok) {
          throw new Error('Failed to start crawl');
        }

        const { crawlId: newCrawlId } = await response.json();
        setCrawlId(newCrawlId);

        // Poll for status
        let status = 'running';
        while (status === 'running') {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const statusRes = await fetch(`/api/crawl-status?crawlId=${newCrawlId}`);
          const statusData = await statusRes.json();
          status = statusData.status;

          if (statusData.phase) {
            updateMessage(loadingId, {
              content: `Scanning ${url}... ${statusData.phase}`,
            });
          }
        }

        // Get results
        const resultsRes = await fetch(`/api/crawl-results?crawlId=${newCrawlId}`);
        const crawlResults: CrawlResults = await resultsRes.json();
        setResults(crawlResults);

        // Remove loading message and add results
        removeMessage(loadingId);

        if (crawlResults.redirects.length === 0) {
          addMessage({
            role: 'assistant',
            content: `Scan complete! No 301 redirects found on ${url}. Your site looks good!`,
            type: 'text',
          });
        } else {
          addMessage({
            role: 'assistant',
            content: `Found ${crawlResults.redirects.length} link(s) with 301 redirects:`,
            type: 'results',
            data: crawlResults,
          });
        }
      } catch (error) {
        removeMessage(loadingId);
        addMessage({
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to scan website'}`,
          type: 'text',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, updateMessage, removeMessage]
  );

  const fixLink = useCallback(
    async (linkId: string, credentials: { siteUrl: string; username: string; appPassword: string }) => {
      if (!results) return;

      const link = results.redirects.find((r) => r.id === linkId);
      if (!link) return;

      // Update link status to fixing
      setResults((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          redirects: prev.redirects.map((r) =>
            r.id === linkId ? { ...r, status: 'fixing' as const } : r
          ),
        };
      });

      try {
        const response = await fetch('/api/fix-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceUrl: link.sourceUrl,
            destUrl: link.destUrl,
            wpConfig: credentials,
          }),
        });

        const result: FixResult = await response.json();

        setResults((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            redirects: prev.redirects.map((r) =>
              r.id === linkId
                ? { ...r, status: result.status === 'success' ? 'fixed' : 'error' }
                : r
            ),
          };
        });

        addMessage({
          role: 'assistant',
          content:
            result.status === 'success'
              ? `Fixed! Updated ${result.affectedPages} page(s).`
              : `Error: ${result.message}`,
          type: 'fix-result',
          data: result,
        });
      } catch (error) {
        setResults((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            redirects: prev.redirects.map((r) =>
              r.id === linkId ? { ...r, status: 'error' } : r
            ),
          };
        });

        addMessage({
          role: 'assistant',
          content: `Error fixing link: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'text',
        });
      }
    },
    [results, addMessage]
  );

  return {
    messages,
    isLoading,
    crawlId,
    results,
    startCrawl,
    fixLink,
    addMessage,
    setResults,
  };
}
