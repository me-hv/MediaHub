import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-300 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-rose-200">Analysis Error</p>
        <p className="mt-0.5 text-rose-300/90">{message}</p>
      </div>
    </div>
  );
}
