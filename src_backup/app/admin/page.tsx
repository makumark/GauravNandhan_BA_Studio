"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Activity, BarChart3, LogOut, Plus, Trash2,
  Check, AlertTriangle, Brain, Crown, Eye, Edit3,
  ArrowLeft, RefreshCw, FileText, Loader2, X, Lock, UserCheck, UserMinus, Mail
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  BA_LEAD: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  BA_ANALYST: "bg-green-500/20 text-green-300 border-green-500/30",
  VIEWER: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const ROLE_ICONS: Record<string, any> = {
  ADMIN: Crown,
  BA_LEAD: Brain,
  BA_ANALYST: Edit3,
  VIEWER: Eye,
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  DOCUMENT_GENERATED: { label: "Document Generated", color: "text-blue-400" },
  SESSION_SAVED: { label: "Session Saved", color: "text-green-400" },
  PDF_EXPORTED: { label: "PDF Exported", color: "text-amber-400" },
  USER_INVITED: { label: "User Invited", color: "text-purple-400" },
  USER_REMOVED: { label: "User Removed", color: "text-red-400" },
  ROLE_CHANGED: { label: "Role Changed", color: "text-cyan-400" },
  NAME_UPDATED: { label: "Name Updated", color: "text-blue-300" },
  PASSWORD_RESET: { label: "Password Reset", color: "text-amber-500" },
  EMAIL_UPDATED: { label: "Email Updated", color: "text-cyan-300" },
  USER_SUSPENDED: { label: "User Suspended", color: "text-red-500" },
  USER_ACTIVATED: { label: "User Activated", color: "text-emerald-500" },
  LOGIN: { label: "Login", color: "text-slate-400" },
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "audit">("overview");
  const [usage, setUsage] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("BA_ANALYST");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Edit modal state
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const userRole = (session?.user as any)?.role;
  const orgName = (session?.user as any)?.orgName;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status === "authenticated" && userRole !== "ADMIN") { router.push("/"); return; }
    if (status === "authenticated") loadAll();
  }, [status, userRole]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usageRes, usersRes, auditRes] = await Promise.all([
        fetch("/api/admin/usage"),
        fetch("/api/admin/users"),
        fetch("/api/admin/audit?limit=100"),
      ]);
      if (usageRes.ok) setUsage(await usageRes.json());
      if (usersRes.ok) { const d = await usersRes.json(); setMembers(d.members || []); setOrg(d.org); }
      if (auditRes.ok) { const d = await auditRes.json(); setAuditLogs(d.logs || []); }
    } finally { setLoading(false); }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadAll(); setRefreshing(false); };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true); setInviteMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, memberRole: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteMsg({ type: "error", text: data.error || "Failed to invite user" }); return; }
      setInviteMsg({ type: "success", text: `${inviteEmail} has been added to your organization as ${inviteRole}.` });
      setInviteEmail(""); setInviteName("");
      await loadAll();
    } finally { setInviting(false); }
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          memberId: editingMember.id, 
          newRole: editRole,
          newName: editName,
          newEmail: editEmail,
          newPassword: editPassword || undefined
        }),
      });
      if (res.ok) {
        setEditingMember(null);
        setEditPassword("");
        await loadAll();
      }
    } finally { setSavingEdit(false); }
  };

  const toggleUserStatus = async (member: any) => {
    const newStatus = !member.isActive;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id, newStatus }),
    });
    if (res.ok) await loadAll();
  };

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from your organization? They will lose all access.`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (res.ok) await loadAll();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingMember(null)} />
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setEditingMember(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              Edit Team Member
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Full Name</label>
                <input 
                  value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    value={editEmail} onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Role</label>
                <select 
                  value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="BA_LEAD">BA Lead</option>
                  <option value="BA_ANALYST">BA Analyst</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block text-amber-500">Reset Password (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" placeholder="Enter new password"
                    value={editPassword} onChange={e => setEditPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button 
                onClick={handleSaveEdit} disabled={savingEdit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Studio
            </button>
            <div className="w-px h-5 bg-slate-700" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Admin Panel</h1>
                <p className="text-[10px] text-slate-500">{orgName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${refreshing ? "animate-spin" : ""}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* License Warning */}
        {usage?.isNearLimit && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${usage.isAtLimit ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">
                {usage.isAtLimit
                  ? `License limit reached — ${usage.totalMembers}/${usage.maxUsers} users`
                  : `Approaching license limit — ${usage.totalMembers}/${usage.maxUsers} users (${usage.usagePercent}%)`}
              </p>
              <p className="text-xs opacity-75 mt-0.5">
                {usage.isAtLimit
                  ? "You cannot invite more users. Please contact us to upgrade your plan."
                  : "Consider upgrading your plan to Professional or Enterprise to add more seats."}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-8 w-fit">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "User Management", icon: Users },
            { id: "audit", label: "Audit Log", icon: Activity },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && usage && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Active Users", value: `${usage.totalMembers} / ${usage.maxUsers}`, sub: `${usage.plan} plan`, color: "from-blue-600 to-cyan-500", icon: Users },
                { label: "Docs Generated", value: usage.docsThisMonth, sub: "this month", color: "from-purple-600 to-blue-600", icon: FileText },
                { label: "Sessions Saved", value: usage.sessionsThisMonth, sub: "this month", color: "from-green-600 to-emerald-500", icon: Activity },
                { label: "Total Projects", value: usage.totalSessions, sub: "all time", color: "from-amber-600 to-orange-500", icon: BarChart3 },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-colors">
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-6 translate-x-6 group-hover:opacity-10 transition-opacity`} />
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Usage bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                License Usage
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>{usage.totalMembers} users active</span>
                <span>{usage.maxUsers} user limit ({usage.plan})</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${usage.isAtLimit ? "bg-red-500" : usage.isNearLimit ? "bg-amber-500" : "bg-gradient-to-r from-blue-600 to-cyan-500"}`}
                  style={{ width: `${Math.min(usage.usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-2">{usage.usagePercent}% of license capacity used</p>
            </div>

            {/* Plan info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Organization Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500 text-xs">Organization Name</p><p className="text-white font-medium mt-1">{usage.orgName}</p></div>
                <div><p className="text-slate-500 text-xs">Current Plan</p><p className="text-blue-400 font-bold mt-1">{usage.plan}</p></div>
                <div><p className="text-slate-500 text-xs">Account Status</p><p className={`font-medium mt-1 ${usage.isActive ? "text-green-400" : "text-red-400"}`}>{usage.isActive ? "Active" : "Suspended"}</p></div>
                <div><p className="text-slate-500 text-xs">Seat Limit</p><p className="text-white font-medium mt-1">{usage.maxUsers} users</p></div>
              </div>
            </div>
          </div>
        )}

        {/* ── USER MANAGEMENT TAB ──────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Invite form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Invite Team Member
              </h3>
              <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Email address *"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="BA_ANALYST">BA Analyst</option>
                  <option value="BA_LEAD">BA Lead</option>
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || usage?.isAtLimit}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {inviting ? "Adding..." : "Add Member"}
                </button>
              </form>
              {inviteMsg && (
                <div className={`mt-3 p-3 rounded-xl text-sm flex items-center gap-2 ${inviteMsg.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {inviteMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {inviteMsg.text}
                </div>
              )}
            </div>

            {/* Members table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Team Members ({members.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      {["Member", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {members.map((m) => {
                      const RoleIcon = ROLE_ICONS[m.role] || Eye;
                      const isSelf = m.user.email === session?.user?.email;
                      return (
                        <tr key={m.id} className={`hover:bg-slate-800/30 transition-colors ${!m.isActive ? "opacity-50" : ""}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                {(m.user.name || m.user.email || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{m.user.name || "—"}</p>
                                {isSelf && <span className="text-[9px] text-blue-400 font-bold">YOU</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{m.user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${ROLE_COLORS[m.role]}`}>
                              <RoleIcon className="w-3 h-3" />{m.role.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                              {m.isActive ? "ACTIVE" : "SUSPENDED"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(m.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {!isSelf && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingMember(m);
                                      setEditName(m.user.name || "");
                                      setEditEmail(m.user.email || "");
                                      setEditRole(m.role);
                                      setEditPassword("");
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                    title="Edit User"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => toggleUserStatus(m)}
                                    className={`p-1.5 rounded-lg transition-colors ${m.isActive ? "text-slate-500 hover:text-amber-400 hover:bg-amber-500/10" : "text-slate-500 hover:text-green-400 hover:bg-green-500/10"}`}
                                    title={m.isActive ? "Suspend User" : "Activate User"}
                                  >
                                    {m.isActive ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleRemove(m.id, m.user.email)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Remove from organization"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── AUDIT LOG TAB ────────────────────────────────────────────────────── */}
        {activeTab === "audit" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Audit Log ({auditLogs.length} entries)
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Immutable record of all actions in your organization</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    {["Timestamp", "User", "Action", "Resource", "Details"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                        No audit events recorded yet. Actions like document generation and user management will appear here.
                      </td>
                    </tr>
                  ) : auditLogs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "text-slate-400" };
                    let metaObj: any = {};
                    try { metaObj = log.metadata ? JSON.parse(log.metadata) : {}; } catch {}
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}{" "}
                          {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-300">{log.userEmail}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold ${actionInfo.color}`}>{actionInfo.label}</span>
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-400">{log.resourceType || "—"}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">
                          {Object.entries(metaObj).map(([k, v]) => `${k}: ${v}`).join(" · ") || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
