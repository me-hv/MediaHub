import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 py-8 text-center text-xs text-text-muted">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} MediaHub Universal Engine. High-performance modular architecture.</p>
        <div className="flex gap-6">
          <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
          <span className="hover:text-white transition-colors cursor-pointer">API Docs</span>
        </div>
      </div>
    </footer>
  );
}
