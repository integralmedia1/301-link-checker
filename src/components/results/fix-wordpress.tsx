'use client';

import { useState } from 'react';
import { RedirectLink, WPCredentials } from '@/types';

interface FixWordpressProps {
  redirect: RedirectLink;
  onFix: (credentials: WPCredentials) => void;
  onCancel: () => void;
}

export function FixWordpress({ redirect, onFix, onCancel }: FixWordpressProps) {
  const [siteUrl, setSiteUrl] = useState(() => {
    try {
      const url = new URL(redirect.sourceUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      return '';
    }
  });
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!siteUrl || !username || !appPassword) {
      setError('Please fill in all fields');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/verify-wp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, username, appPassword }),
      });

      const data = await response.json();

      if (data.valid) {
        setVerified(true);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Failed to verify credentials');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFix = () => {
    onFix({ siteUrl, username, appPassword });
  };

  return (
    <div className="space-y-4">
      {/* WordPress detected badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#238636]/10 border border-[#238636]/30">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#3fb950]">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10 5.523 0 10-4.477 10-10 0-5.523-4.477-10-10-10z" fill="currentColor" fillOpacity="0.2"/>
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" fill="currentColor"/>
          <path d="M3.512 12l2.89 7.913c-1.737-1.689-2.818-4.047-2.89-7.913zm13.684 0l-2.857 7.843c.93-.322 1.773-.813 2.504-1.44.73-.627 1.331-1.382 1.77-2.24.438-.858.699-1.795.77-2.763a7.94 7.94 0 00-.187-1.4zM12 4.583c-.878 0-1.729.143-2.521.408L12 12.418l2.521-7.427A7.959 7.959 0 0012 4.583z" fill="currentColor"/>
        </svg>
        <span className="text-sm font-medium text-[#3fb950]">WordPress Detected</span>
      </div>

      {/* Form fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
            Site URL
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            value={siteUrl}
            onChange={(e) => {
              setSiteUrl(e.target.value);
              setVerified(false);
            }}
            disabled={verified}
            className="
              w-full px-3 py-2.5 rounded-lg
              bg-[#0d1117] border border-[#30363d]
              text-sm font-mono text-[#e6e6e6] placeholder-[#8b949e]
              focus:outline-none focus:border-[#00d9ff] focus:ring-1 focus:ring-[#00d9ff]/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
            Username
          </label>
          <input
            type="text"
            placeholder="admin"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setVerified(false);
            }}
            disabled={verified}
            className="
              w-full px-3 py-2.5 rounded-lg
              bg-[#0d1117] border border-[#30363d]
              text-sm text-[#e6e6e6] placeholder-[#8b949e]
              focus:outline-none focus:border-[#00d9ff] focus:ring-1 focus:ring-[#00d9ff]/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
            Application Password
          </label>
          <input
            type="password"
            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
            value={appPassword}
            onChange={(e) => {
              setAppPassword(e.target.value);
              setVerified(false);
            }}
            disabled={verified}
            className="
              w-full px-3 py-2.5 rounded-lg
              bg-[#0d1117] border border-[#30363d]
              text-sm font-mono text-[#e6e6e6] placeholder-[#8b949e]
              focus:outline-none focus:border-[#00d9ff] focus:ring-1 focus:ring-[#00d9ff]/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          />
          <p className="mt-1.5 text-[10px] text-[#8b949e]">
            WP Admin → Users → Profile → Application Passwords
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Verified message */}
      {verified && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3fb950]/10 border border-[#3fb950]/30 text-[#3fb950] text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Connection verified successfully</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="
            flex-1 px-4 py-2.5 rounded-lg
            bg-[#21262d] border border-[#30363d]
            text-sm font-medium text-[#8b949e]
            hover:bg-[#30363d] hover:text-[#e6e6e6]
            transition-all duration-200
          "
        >
          Cancel
        </button>
        {!verified ? (
          <button
            onClick={handleVerify}
            disabled={isVerifying || !siteUrl || !username || !appPassword}
            className="
              flex-1 px-4 py-2.5 rounded-lg
              bg-[#21262d] border border-[#00d9ff]
              text-sm font-medium text-[#00d9ff]
              hover:bg-[#00d9ff]/10
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-[#00d9ff] border-t-transparent animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Verify Connection</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleFix}
            className="
              flex-1 px-4 py-2.5 rounded-lg
              bg-gradient-to-r from-[#00d9ff] to-[#1f6feb]
              text-sm font-medium text-[#0a0e14]
              hover:opacity-90
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <span>Fix Link</span>
          </button>
        )}
      </div>
    </div>
  );
}
