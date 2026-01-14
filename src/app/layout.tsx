import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "301 Link Checker",
  description: "Scan websites for 301 redirect links and fix them",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="h-16 border-b border-[#30363d]/50 bg-[#0d1117]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#1f6feb] flex items-center justify-center glow-cyan group-hover:glow-cyan-strong transition-all duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#0a0e14]">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-[#e6e6e6] group-hover:text-[#00d9ff] transition-colors">
                301 Link Checker
              </span>
              <span className="text-[10px] font-mono text-[#8b949e] tracking-wider uppercase">
                SEO Redirect Scanner
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#21262d]/50 border border-[#30363d]">
              <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
              <span className="text-xs font-mono text-[#8b949e]">Ready</span>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
