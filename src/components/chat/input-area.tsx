'use client';

import { useState, FormEvent } from 'react';

interface InputAreaProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string.startsWith('http') ? string : `https://${string}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function InputArea({ onSubmit, disabled }: InputAreaProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    const normalizedUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
    onSubmit(normalizedUrl);
    setUrl('');
  };

  return (
    <div className="border-t border-[#30363d]/50 bg-[#0d1117]/80 backdrop-blur-md p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div
          className={`
            relative rounded-xl overflow-hidden transition-all duration-300
            ${isFocused ? 'glow-cyan-strong' : ''}
            ${error ? 'ring-2 ring-[#f85149]' : ''}
          `}
        >
          {/* Gradient border effect */}
          <div className={`
            absolute inset-0 rounded-xl p-[1px] overflow-hidden
            ${isFocused ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-300
          `}>
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d9ff] via-[#1f6feb] to-[#00d9ff] animate-gradient-shift" />
          </div>

          <div className="relative bg-[#161b22] rounded-xl flex items-center">
            {/* URL icon */}
            <div className="pl-4 pr-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8b949e]">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>

            {/* Input field */}
            <input
              type="text"
              placeholder="Enter website URL to scan..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              className="
                flex-1 py-4 pr-4 bg-transparent
                text-[#e6e6e6] placeholder-[#8b949e]
                font-mono text-sm
                focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={disabled || !url.trim()}
              className="
                m-2 px-6 py-2.5 rounded-lg
                font-medium text-sm
                bg-gradient-to-r from-[#00d9ff] to-[#1f6feb]
                text-[#0a0e14]
                hover:opacity-90
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center gap-2
              "
            >
              {disabled ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  <span>Scanning</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2 flex items-center gap-2 text-[#f85149] text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Helper text */}
        <p className="mt-3 text-center text-xs text-[#8b949e]">
          Example: <span className="font-mono text-[#00d9ff]">example.com</span> or <span className="font-mono text-[#00d9ff]">https://www.example.com</span>
        </p>
      </form>
    </div>
  );
}
