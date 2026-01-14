'use client';

import { useState, useEffect } from 'react';
import { RedirectLink, WPCredentials, CMSInfo } from '@/types';
import { FixWordpress } from './fix-wordpress';
import { FixManual } from './fix-manual';

interface FixModalProps {
  open: boolean;
  onClose: () => void;
  redirect: RedirectLink;
  onFix: (credentials: WPCredentials) => void;
}

export function FixModal({ open, onClose, redirect, onFix }: FixModalProps) {
  const [cmsInfo, setCmsInfo] = useState<CMSInfo | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (open && !cmsInfo) {
      detectCMS();
    }
  }, [open]);

  const detectCMS = async () => {
    setIsDetecting(true);
    try {
      const url = new URL(redirect.sourceUrl);
      const siteUrl = `${url.protocol}//${url.host}`;

      const response = await fetch('/api/detect-cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setCmsInfo(data);
      } else {
        setCmsInfo({ type: 'unknown', detected: false, indicators: [] });
      }
    } catch {
      setCmsInfo({ type: 'unknown', detected: false, indicators: [] });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleClose = () => {
    setCmsInfo(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl animate-fade-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00d9ff]/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-[#e6e6e6]">Fix Broken Link</h2>
              <p className="text-xs text-[#8b949e]">Replace with redirect destination</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* URL Preview */}
        <div className="p-4 bg-[#0d1117] border-b border-[#30363d]">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#8b949e] mt-0.5 w-16 flex-shrink-0">Replace</span>
              <code className="font-mono text-xs text-[#f85149] break-all">{redirect.sourceUrl}</code>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#8b949e] mt-0.5 w-16 flex-shrink-0">With</span>
              <code className="font-mono text-xs text-[#3fb950] break-all">{redirect.destUrl}</code>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isDetecting ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#00d9ff] border-t-transparent animate-spin" />
              <span className="text-sm text-[#8b949e]">Detecting CMS...</span>
            </div>
          ) : cmsInfo?.type === 'wordpress' ? (
            <FixWordpress redirect={redirect} onFix={onFix} onCancel={handleClose} />
          ) : (
            <FixManual cmsInfo={cmsInfo} onClose={handleClose} />
          )}
        </div>
      </div>
    </div>
  );
}
