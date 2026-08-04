import React from 'react';

export function SkeletonCard() {
  return (
    <div className="w-full max-w-3xl mx-auto glass-panel rounded-2xl p-6 space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-64 h-36 bg-slate-800/60 rounded-xl shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-800/80 rounded w-1/4"></div>
          <div className="h-6 bg-slate-800/80 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800/60 rounded w-1/2"></div>
          <div className="h-4 bg-slate-800/60 rounded w-1/3"></div>
        </div>
      </div>
      <div className="h-10 bg-slate-800/60 rounded-xl w-full"></div>
    </div>
  );
}
