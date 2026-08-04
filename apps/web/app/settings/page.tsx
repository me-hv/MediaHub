'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api.service';
import { UserSettingsData } from '@mediahub/types';
import { Settings, Save, CheckCircle2, LogIn } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export default function SettingsPage() {
  const { user, signInWithGoogle } = useAuth();
  const { addToast } = useNotification();
  const [settings, setSettings] = useState<UserSettingsData>({
    defaultFormat: 'mp4',
    defaultQuality: 'best',
    filenameTemplate: '{title}',
    autoAnalyze: true,
    maxConcurrentDownloads: 3,
    theme: 'DARK',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const data = await ApiService.getUserSettings(user.id);
        setSettings(data);
      } catch {}
    }
    loadSettings();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user) {
        await ApiService.updateUserSettings(user.id, settings);
      }
      addToast({ type: 'success', title: 'Settings Saved', message: 'User preferences updated successfully.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In to Configure Settings</h2>
          <p className="text-xs text-slate-400">Save custom filename templates, default video quality, and concurrent download settings across devices.</p>
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
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">User Settings & Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-400">Customize default format, filename templates, theme, and downloader engine concurrency.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="space-y-4 border-b border-white/10 pb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            Media Download Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Default Format</label>
              <select
                value={settings.defaultFormat}
                onChange={(e) => setSettings({ ...settings, defaultFormat: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none"
              >
                <option value="mp4">MP4 (Video + Audio)</option>
                <option value="mp3">MP3 (Audio Only)</option>
                <option value="m4a">M4A (Audio Only)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Default Quality</label>
              <select
                value={settings.defaultQuality}
                onChange={(e) => setSettings({ ...settings, defaultQuality: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none"
              >
                <option value="best">Best Available Quality</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Custom Filename Template</label>
              <select
                value={settings.filenameTemplate}
                onChange={(e) => setSettings({ ...settings, filenameTemplate: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none font-mono"
              >
                <option value="{title}">{`{title}`}</option>
                <option value="{uploader}-{title}">{`{uploader}-{title}`}</option>
                <option value="{uploadDate}-{title}">{`{uploadDate}-{title}`}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Max Concurrent Downloads</label>
              <input
                type="number"
                min={1}
                max={5}
                value={settings.maxConcurrentDownloads}
                onChange={(e) => setSettings({ ...settings, maxConcurrentDownloads: parseInt(e.target.value) || 3 })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
