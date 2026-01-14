'use client';

import { CMSInfo } from '@/types';

interface FixManualProps {
  cmsInfo: CMSInfo | null;
  onClose: () => void;
}

const cmsGuidance: Record<string, { name: string; icon: string; steps: string[] }> = {
  shopify: {
    name: 'Shopify',
    icon: 'S',
    steps: [
      'Go to your Shopify Admin dashboard',
      'Navigate to Online Store → Pages or Blog Posts',
      'Find the page containing the broken link',
      'Edit the content and update the URL',
      'Click Save to apply changes',
    ],
  },
  wix: {
    name: 'Wix',
    icon: 'W',
    steps: [
      'Open the Wix Editor',
      'Click on the element with the broken link',
      'Update the link URL in the settings panel',
      'Click Publish to save your changes',
    ],
  },
  squarespace: {
    name: 'Squarespace',
    icon: 'SS',
    steps: [
      'Open the Page Editor',
      'Click on the text or button with the broken link',
      'Update the link in the formatting toolbar',
      'Click Save and Publish',
    ],
  },
  webflow: {
    name: 'Webflow',
    icon: 'WF',
    steps: [
      'Open the Webflow Designer',
      'Select the element with the broken link',
      'Update the link settings in the right panel',
      'Click Publish to deploy changes',
    ],
  },
  unknown: {
    name: 'Unknown CMS',
    icon: '?',
    steps: [
      'Log into your website admin panel',
      'Find the page containing the broken link',
      'Edit the page content',
      'Search for the old URL and replace with the new one',
      'Save and publish your changes',
    ],
  },
};

export function FixManual({ cmsInfo, onClose }: FixManualProps) {
  const cms = cmsInfo?.type || 'unknown';
  const guidance = cmsGuidance[cms] || cmsGuidance.unknown;

  return (
    <div className="space-y-4">
      {/* CMS detection badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#d29922]/10 border border-[#d29922]/30">
        <div className="w-6 h-6 rounded bg-[#d29922]/20 flex items-center justify-center text-xs font-bold text-[#d29922]">
          {guidance.icon}
        </div>
        <div>
          <span className="text-sm font-medium text-[#d29922]">
            {cmsInfo?.detected ? `${guidance.name} Detected` : 'Manual Fix Required'}
          </span>
        </div>
      </div>

      {/* Detection indicators */}
      {cmsInfo?.indicators && cmsInfo.indicators.length > 0 && (
        <div className="px-3 py-2 rounded-lg bg-[#21262d] border border-[#30363d]">
          <p className="text-[10px] uppercase tracking-wider text-[#8b949e] mb-1">Detection Indicators</p>
          <ul className="space-y-1">
            {cmsInfo.indicators.map((indicator, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-[#8b949e]">
                <span className="w-1 h-1 rounded-full bg-[#8b949e]" />
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Manual fix steps */}
      <div>
        <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-3">Steps to Fix Manually</p>
        <ol className="space-y-2">
          {guidance.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[10px] font-medium text-[#8b949e]">
                {i + 1}
              </span>
              <span className="text-sm text-[#e6e6e6] leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="
          w-full px-4 py-2.5 rounded-lg
          bg-[#21262d] border border-[#30363d]
          text-sm font-medium text-[#8b949e]
          hover:bg-[#30363d] hover:text-[#e6e6e6]
          transition-all duration-200
        "
      >
        Close
      </button>
    </div>
  );
}
