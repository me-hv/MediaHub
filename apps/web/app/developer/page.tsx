'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api.service';
import { ApiKeyItemData, WebhookConfigData } from '@mediahub/types';
import { Key, Webhook, BarChart3, BookOpen, Plus, Trash2, Copy, Shield, CheckCircle2, AlertCircle, LogIn, Eye } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export default function DeveloperPortalPage() {
  const { user, signInWithGoogle } = useAuth();
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'analytics' | 'docs'>('keys');

  // Keys State
  const [keys, setKeys] = useState<ApiKeyItemData[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookConfigData[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  useEffect(() => {
    async function loadDevData() {
      if (!user) return;
      try {
        const [kRes, wRes] = await Promise.all([
          ApiService.listApiKeys(user.id),
          ApiService.listWebhooks(user.id),
        ]);
        setKeys(kRes.keys);
        setWebhooks(wRes.webhooks);
      } catch {
        setKeys([
          { id: 'k1', name: 'Production Microservice', keyPrefix: 'mh_live_a1b2', scopes: ['media.read', 'media.download'], status: 'ACTIVE', createdAt: new Date().toISOString() },
        ]);
        setWebhooks([
          { id: 'w1', url: 'https://api.myapp.com/webhooks/mediahub', secretPrefix: 'whsec_x9y8', events: ['download.completed'], status: 'ACTIVE', createdAt: new Date().toISOString() },
        ]);
      }
    }
    loadDevData();
  }, [user]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !user) return;

    try {
      const res = await ApiService.createApiKey(user.id, newKeyName);
      setKeys((prev) => [res.apiKey, ...prev]);
      setCreatedSecret(res.apiKey.secretKey || null);
      setNewKeyName('');
      addToast({ type: 'success', title: 'API Key Generated', message: 'Copy your secret key now. It will not be shown again.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Key Generation Failed', message: err.message });
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!user) return;
    await ApiService.revokeApiKey(id, user.id);
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'REVOKED' } : k)));
    addToast({ type: 'info', title: 'Key Revoked', message: 'API Key access revoked.' });
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim() || !user) return;

    try {
      const res = await ApiService.createWebhook(user.id, newWebhookUrl);
      setWebhooks((prev) => [res.webhook, ...prev]);
      setNewWebhookUrl('');
      addToast({ type: 'success', title: 'Webhook Endpoint Configured', message: 'HMAC signature secret generated.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Webhook Creation Failed', message: err.message });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'info', title: 'Copied', message: 'Copied to clipboard.' });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In for Developer Platform</h2>
          <p className="text-xs text-slate-400">Manage API Keys, configure webhook delivery endpoints, inspect request logs, and access OpenAPI documentation.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Developer Platform & Portal</h1>
          <p className="text-xs sm:text-sm text-slate-400">Manage API credentials, configure HMAC webhooks, inspect analytics, and integrate MediaHub SDKs.</p>
        </div>

        <button
          onClick={() => setShowKeyModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New API Key</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'keys' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Keys</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'webhooks' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Webhooks</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'analytics' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'docs' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>OpenAPI Docs</span>
        </button>
      </div>

      {/* Secret Display Banner (Only shown once upon creation) */}
      {createdSecret && (
        <div className="glass-panel p-5 rounded-2xl border-indigo-500/50 bg-indigo-950/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Save Your Secret Key
            </span>
            <button onClick={() => handleCopy(createdSecret)} className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 font-semibold">
              <Copy className="w-3.5 h-3.5" /> Copy Secret
            </button>
          </div>
          <p className="text-[11px] text-slate-300">Copy this secret key now. For security, it will never be displayed again.</p>
          <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 break-all border border-white/10 select-all">
            {createdSecret}
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Active Developer API Keys</h3>
          <div className="divide-y divide-white/5">
            {keys.map((key) => (
              <div key={key.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">{key.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${key.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {key.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">Prefix: {key.keyPrefix}...</p>
                  <p className="text-[10px] text-slate-500">Scopes: {key.scopes.join(', ')}</p>
                </div>

                {key.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Revoke Key
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <form onSubmit={handleCreateWebhook} className="space-y-3 border-b border-white/10 pb-6">
            <h3 className="text-sm font-bold text-white">Add Webhook Endpoint</h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/webhooks/mediahub"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shrink-0"
              >
                Add Endpoint
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Webhooks</h4>
            {webhooks.map((w) => (
              <div key={w.id} className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white font-semibold truncate">{w.url}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">HMAC Signed</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Secret Prefix: {w.secretPrefix}...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400">Total API Requests</span>
            <p className="text-2xl font-black text-white">12,480</p>
            <p className="text-[10px] text-emerald-400 font-medium">99.8% Success Rate</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400">Bandwidth Delivered</span>
            <p className="text-2xl font-black text-white">184.2 GB</p>
            <p className="text-[10px] text-indigo-400 font-medium">Avg ~14.8 MB/req</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl space-y-2">
            <span className="text-xs text-slate-400">Average Latency</span>
            <p className="text-2xl font-black text-white">42 ms</p>
            <p className="text-[10px] text-purple-400 font-medium">P99: 110ms</p>
          </div>
        </div>
      )}

      {/* OpenAPI Docs Tab */}
      {activeTab === 'docs' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white">OpenAPI 3.1 REST Specification</h3>
          <p className="text-xs text-slate-400">Public endpoints accept <code className="text-indigo-300 font-mono">Authorization: Bearer mh_live_...</code> or <code className="text-indigo-300 font-mono">X-API-Key</code> headers.</p>
          <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto space-y-2">
            <p className="text-emerald-400">POST /api/v1/public/analyze</p>
            <p className="text-emerald-400">POST /api/v1/public/download</p>
            <p className="text-emerald-400">GET  /api/v1/public/me</p>
            <p className="text-emerald-400">GET  /api/v1/public/history</p>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleCreateKey} className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-white/10">
            <h3 className="text-base font-bold text-white">Generate Developer API Key</h3>
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-400 font-medium">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Backend Service"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-slate-400 hover:text-white px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newKeyName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-md"
              >
                Generate Key
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
