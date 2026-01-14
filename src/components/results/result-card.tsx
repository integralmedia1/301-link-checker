'use client';

import { useState } from 'react';
import { RedirectLink, WPCredentials } from '@/types';
import { FixModal } from './fix-modal';

interface ResultCardProps {
  redirect: RedirectLink;
  onFix?: (linkId: string, credentials: WPCredentials) => void;
}

export function ResultCard({ redirect, onFix }: ResultCardProps) {
  const [showFixModal, setShowFixModal] = useState(false);

  const statusConfig = {
    pending: {
      bg: 'bg-[#d29922]/10',
      border: 'border-[#d29922]/30',
      text: 'text-[#d29922]',
      dot: 'bg-[#d29922]',
      label: 'Pending',
    },
    fixing: {
      bg: 'bg-[#00d9ff]/10',
      border: 'border-[#00d9ff]/30',
      text: 'text-[#00d9ff]',
      dot: 'bg-[#00d9ff] animate-pulse',
      label: 'Fixing...',
    },
    fixed: {
      bg: 'bg-[#3fb950]/10',
      border: 'border-[#3fb950]/30',
      text: 'text-[#3fb950]',
      dot: 'bg-[#3fb950]',
      label: 'Fixed',
    },
    error: {
      bg: 'bg-[#f85149]/10',
      border: 'border-[#f85149]/30',
      text: 'text-[#f85149]',
      dot: 'bg-[#f85149]',
      label: 'Error',
    },
  };

  const status = statusConfig[redirect.status];

  const handleFix = (credentials: WPCredentials) => {
    if (onFix) {
      onFix(redirect.id, credentials);
    }
    setShowFixModal(false);
  };

  return (
    <>
      <div className={`
        rounded-lg border ${status.border} ${status.bg}
        p-4 space-y-3
        transition-all duration-200
        hover:border-[#30363d]
      `}>
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 301 badge */}
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/30">
              {redirect.statusCode}
            </span>
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          <button
            onClick={() => setShowFixModal(true)}
            disabled={redirect.status === 'fixing' || redirect.status === 'fixed'}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-200
              ${redirect.status === 'fixed'
                ? 'bg-[#3fb950]/20 text-[#3fb950] cursor-default'
                : redirect.status === 'fixing'
                  ? 'bg-[#21262d] text-[#8b949e] cursor-wait'
                  : 'bg-[#00d9ff] text-[#0a0e14] hover:opacity-90 cursor-pointer'
              }
              disabled:opacity-50
            `}
          >
            {redirect.status === 'fixed' ? (
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Fixed
              </span>
            ) : redirect.status === 'fixing' ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Fixing
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                Fix
              </span>
            )}
          </button>
        </div>

        {/* URL info */}
        <div className="space-y-2">
          {/* Source URL */}
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#8b949e] mt-1 w-12 flex-shrink-0">From</span>
            <code className="text-xs font-mono text-[#f85149] break-all leading-relaxed">
              {redirect.sourceUrl}
            </code>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-2 pl-12">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider text-[#8b949e]">redirects to</span>
          </div>

          {/* Destination URL */}
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[#8b949e] mt-1 w-12 flex-shrink-0">To</span>
            <code className="text-xs font-mono text-[#3fb950] break-all leading-relaxed">
              {redirect.destUrl}
            </code>
          </div>
        </div>

        {/* Found on pages */}
        {redirect.foundOnPages.length > 0 && (
          <div className="pt-2 border-t border-[#30363d]/50">
            <p className="text-[10px] uppercase tracking-wider text-[#8b949e] mb-1">Found on</p>
            <div className="flex flex-wrap gap-1">
              {redirect.foundOnPages.slice(0, 3).map((page, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-xs font-mono bg-[#21262d] text-[#8b949e]">
                  {page}
                </span>
              ))}
              {redirect.foundOnPages.length > 3 && (
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#21262d] text-[#8b949e]">
                  +{redirect.foundOnPages.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <FixModal
        open={showFixModal}
        onClose={() => setShowFixModal(false)}
        redirect={redirect}
        onFix={handleFix}
      />
    </>
  );
}
