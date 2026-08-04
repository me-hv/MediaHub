'use client';

import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.service';
import { PlatformBadge } from '../../components/media/PlatformBadge';
import { Layers3, ArrowRight, Loader2, CheckCircle2, AlertCircle, Play, Pause } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface BatchAnalyzedItem {
  rawUrl: string;
  urlHash?: string;
  valid: boolean;
  error?: string;
  platform: string;
}

export default function BatchPage() {
  const { addToast } = useNotification();
  const [urlsInput, setUrlsInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<BatchAnalyzedItem[]>([]);
  const [enqueuing, setEnqueuing] = useState(false);
  const [activeJobs, setActiveJobs] = useState<Record<string, any>>({});

  // Multi-job SSE stream connection
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const eventSource = new EventSource(`${apiBase}/api/progress/stream`);

    eventSource.addEventListener('snapshot', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        const map: Record<string, any> = {};
        for (const job of data.jobs || []) {
          map[job.id] = job;
        }
        setActiveJobs(map);
      } catch {}
    });

    eventSource.addEventListener('progress', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setActiveJobs((prev) => ({ ...prev, [data.jobId]: { ...prev[data.jobId], ...data } }));
      } catch {}
    });

    eventSource.addEventListener('completed', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setActiveJobs((prev) => ({ ...prev, [data.jobId]: { ...prev[data.jobId], status: 'COMPLETED', progress: 100 } }));
        addToast({ type: 'success', title: 'Job Completed', message: `Batch item ${data.jobId} completed.` });
      } catch {}
    });

    return () => eventSource.close();
  }, []);

  const handleAnalyzeBatch = async () => {
    const lines = urlsInput.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      addToast({ type: 'error', title: 'Input Error', message: 'Please paste at least one media URL.' });
      return;
    }
    if (lines.length > 50) {
      addToast({ type: 'error', title: 'Batch Limit', message: 'Maximum 50 URLs allowed per batch.' });
      return;
    }

    setAnalyzing(true);
    try {
      const res = await ApiService.analyzeBatch(lines);
      setAnalyzedItems(res.items);
      addToast({ type: 'success', title: 'Batch Analyzed', message: `Validated ${res.totalCount} URLs.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Batch Error', message: err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartBatchDownload = async () => {
    const validItems = analyzedItems.filter((i) => i.valid);
    if (validItems.length === 0) return;

    setEnqueuing(true);
    try {
      await ApiService.enqueueBatch(validItems.map((i) => ({ url: i.rawUrl, formatId: 'best' })));
      addToast({ type: 'success', title: 'Enqueued', message: 'Batch jobs added to QueueManager.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Enqueue Failed', message: err.message });
    } finally {
      setEnqueuing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Batch Media Downloader</h1>
        <p className="text-xs sm:text-sm text-slate-400">Paste multiple mixed media URLs (YouTube, Instagram, X, Reddit...) to download in parallel (Max 50 URLs).</p>
      </div>

      {/* Input Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <textarea
          rows={6}
          value={urlsInput}
          onChange={(e) => setUrlsInput(e.target.value)}
          placeholder={`Paste URLs (one per line):\nhttps://youtube.com/watch?v=...\nhttps://x.com/user/status/...\nhttps://instagram.com/p/...`}
          className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Max 50 URLs • Limited 3-Worker Parallelism</span>
          <button
            onClick={handleAnalyzeBatch}
            disabled={analyzing || !urlsInput.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 disabled:opacity-40"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Validate Batch</span>
          </button>
        </div>
      </div>

      {/* Analyzed Items List */}
      {analyzedItems.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Validated Batch Items ({analyzedItems.filter((i) => i.valid).length}/{analyzedItems.length} Valid)</h3>
            <button
              onClick={handleStartBatchDownload}
              disabled={enqueuing || analyzedItems.filter((i) => i.valid).length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/30 disabled:opacity-40"
            >
              {enqueuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Start Batch Queue</span>
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {analyzedItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
                <div className="flex items-center gap-3 truncate">
                  {item.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span className="font-mono text-slate-300 truncate">{item.rawUrl}</span>
                </div>
                <PlatformBadge platform={item.platform as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Queue Progress */}
      {Object.keys(activeJobs).length > 0 && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers3 className="w-4 h-4 text-indigo-400" />
            Live Queue Jobs (SSE Real-Time Stream)
          </h3>

          <div className="space-y-3">
            {Object.values(activeJobs).map((job: any) => (
              <div key={job.id} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white font-mono">{job.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${job.progress || 0}%` }} />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{job.progress ? `${job.progress.toFixed(1)}%` : '0%'}</span>
                  <span>{job.speed || '0 KiB/s'} • ETA {job.eta || 'Calculating'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
