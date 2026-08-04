'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ApiService } from '../../../services/api.service';
import { OrganizationData, ProjectData, MembershipData, SubscriptionData, InvoiceData } from '@mediahub/types';
import { Building2, Layers, Users, CreditCard, UserPlus, Plus, Shield, ArrowUpRight, CheckCircle2, LogIn, ExternalLink, Sparkles, BarChart3, Activity, Terminal } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';

export default function OrganizationConsolePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const orgSlug = resolvedParams.slug;

  const { user, signInWithGoogle } = useAuth();
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'projects' | 'members' | 'billing' | 'audit'>('overview');

  const [orgs, setOrgs] = useState<OrganizationData[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrganizationData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [members, setMembers] = useState<MembershipData[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'DEVELOPER' | 'VIEWER'>('DEVELOPER');

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    async function loadSaaSData() {
      if (!user) return;
      try {
        const orgList = await ApiService.listUserOrganizations(user.id);
        setOrgs(orgList);
        const matched = orgList.find((o) => o.slug === orgSlug) || orgList[0];
        if (matched) {
          setCurrentOrg(matched);
          const [pRes, mRes, bRes] = await Promise.all([
            ApiService.listProjects(matched.slug, user.id),
            ApiService.getOrganizationMembers(matched.slug, user.id),
            ApiService.getBilling(matched.slug, user.id),
          ]);
          setProjects(pRes.projects);
          setMembers(mRes.members);
          setSubscription(bRes.subscription);
          setInvoices(bRes.invoices);
        }
      } catch {
        const mockOrg: OrganizationData = { id: 'org-1', name: 'Acme Media Corp', slug: 'acme-media', role: 'OWNER', plan: 'PRO', membersCount: 4, projectsCount: 2, createdAt: new Date().toISOString() };
        setCurrentOrg(mockOrg);
        setOrgs([mockOrg]);
        setProjects([
          { id: 'p1', organizationId: 'org-1', name: 'Production Backend', slug: 'production', environment: 'PRODUCTION', status: 'ACTIVE', createdAt: new Date().toISOString() },
          { id: 'p2', organizationId: 'org-1', name: 'Mobile App Staging', slug: 'staging', environment: 'STAGING', status: 'ACTIVE', createdAt: new Date().toISOString() },
        ]);
        setMembers([
          { id: 'm1', userId: user.id, email: user.email, displayName: user.displayName || 'Owner', role: 'OWNER', createdAt: new Date().toISOString() },
          { id: 'm2', userId: 'u2', email: 'dev.lead@acme.com', displayName: 'Sarah Lead', role: 'ADMIN', createdAt: new Date().toISOString() },
        ]);
        setSubscription({ id: 's1', organizationId: 'org-1', plan: 'PRO', cancelAtPeriodEnd: false });
        setInvoices([
          { id: 'inv-901', amount: 4900, currency: 'usd', status: 'PAID', createdAt: new Date().toISOString() },
        ]);
      }
    }
    loadSaaSData();
  }, [user, orgSlug]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user || !currentOrg) return;

    try {
      await ApiService.inviteMember(currentOrg.slug, user.id, inviteEmail, inviteRole);
      setShowMemberModal(false);
      setInviteEmail('');
      addToast({ type: 'success', title: 'Invitation Sent', message: `Invited ${inviteEmail} as ${inviteRole}.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Invite Failed', message: err.message });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !user || !currentOrg) return;

    try {
      const res = await ApiService.createProject(currentOrg.slug, user.id, newProjectName);
      setProjects((prev) => [res.project, ...prev]);
      setShowProjectModal(false);
      setNewProjectName('');
      addToast({ type: 'success', title: 'Project Created', message: `Project ${res.project.name} initialized.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Project Creation Failed', message: err.message });
    }
  };

  const handleStripeCheckout = async () => {
    if (!user || !currentOrg) return;
    try {
      const session = await ApiService.createCheckoutSession(currentOrg.slug, user.id, 'PRO');
      window.location.href = session.url;
    } catch (err: any) {
      addToast({ type: 'error', title: 'Checkout Failed', message: err.message });
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In to Access SaaS Portal</h2>
          <p className="text-xs text-slate-400">Manage organizations, projects, team roles, Stripe subscriptions, and multi-tenant quotas.</p>
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
      {/* Header & Workspace Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/20">
            {currentOrg?.name[0] || 'O'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{currentOrg?.name || 'Organization'}</h1>
              <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {subscription?.plan || 'FREE'} PLAN
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Slug: {currentOrg?.slug} • Role: {currentOrg?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>

          <button
            onClick={() => setShowMemberModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'analytics' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Usage Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'projects' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'members' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'billing' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing & Stripe</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'audit' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <span className="text-xs text-slate-400">Monthly Download Usage</span>
              <p className="text-2xl font-black text-white">1,420 / 10,000</p>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: '14.2%' }} />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <span className="text-xs text-slate-400">Active Projects</span>
              <p className="text-2xl font-black text-white">{projects.length} / 5</p>
              <p className="text-[10px] text-emerald-400 font-medium">Within tier limits</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <span className="text-xs text-slate-400">Subscription Tier</span>
              <p className="text-2xl font-black text-white">{subscription?.plan || 'FREE'}</p>
              <button onClick={handleStripeCheckout} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                <span>Upgrade Plan</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <span className="text-xs text-slate-400">Daily API Requests</span>
              <p className="text-2xl font-black text-white">4,820 / day</p>
              <p className="text-[10px] text-emerald-400 font-medium">+18.4% from last week</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <span className="text-xs text-slate-400">Bandwidth Consumed</span>
              <p className="text-2xl font-black text-white">418.6 GB</p>
              <p className="text-[10px] text-indigo-400 font-medium">P99 Latency: 48ms</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <span className="text-xs text-slate-400">Cache Hit Ratio</span>
              <p className="text-2xl font-black text-white">88.4%</p>
              <p className="text-[10px] text-purple-400 font-medium">Redis Layer active</p>
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Organization Projects</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs">{p.name}</span>
                  <span className="bg-indigo-500/10 text-indigo-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-indigo-500/20">
                    {p.environment}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Slug: {p.slug}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Team Members</h3>
          <div className="divide-y divide-white/5">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">{m.displayName || m.email}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{m.email}</p>
                </div>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Stripe Subscription</h3>
              <p className="text-xs text-slate-400">Current plan: <strong className="text-white">{subscription?.plan}</strong></p>
            </div>
            <button
              onClick={handleStripeCheckout}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Manage Stripe Billing</span>
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice History</h4>
            {invoices.map((inv) => (
              <div key={inv.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-white">${(inv.amount / 100).toFixed(2)} USD</span>
                <span className="text-emerald-400 font-bold uppercase">{inv.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Audit Log Stream</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <span className="text-indigo-300">MEMBER_INVITED - invited sarah.lead@acme.com as ADMIN</span>
              <span className="text-slate-500 text-[10px]">Just now</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <span className="text-emerald-300">PROJECT_CREATED - initialized Production Backend (PRODUCTION)</span>
              <span className="text-slate-500 text-[10px]">2 hours ago</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <span className="text-purple-300">PLAN_UPGRADED - subscription updated to PRO PLAN</span>
              <span className="text-slate-500 text-[10px]">1 day ago</span>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleInviteMember} className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-white/10">
            <h3 className="text-base font-bold text-white">Invite Team Member</h3>
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-400 font-medium">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@domain.com"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-400 font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none"
              >
                <option value="ADMIN">Admin (Full project & member management)</option>
                <option value="DEVELOPER">Developer (API keys, downloads, webhooks)</option>
                <option value="VIEWER">Viewer (Read-only access)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowMemberModal(false)} className="text-xs text-slate-400 hover:text-white px-4 py-2">
                Cancel
              </button>
              <button type="submit" disabled={!inviteEmail.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-md">
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleCreateProject} className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-4 border border-white/10">
            <h3 className="text-base font-bold text-white">Create New Project</h3>
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-400 font-medium">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Mobile App Staging"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowProjectModal(false)} className="text-xs text-slate-400 hover:text-white px-4 py-2">
                Cancel
              </button>
              <button type="submit" disabled={!newProjectName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-md">
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
