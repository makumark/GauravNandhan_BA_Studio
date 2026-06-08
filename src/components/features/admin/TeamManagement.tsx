"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Shield, Plus, Loader2, Trash2 } from "lucide-react";

export function TeamManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        setEmail("");
        fetchTeam();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to invite user");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl w-full max-w-4xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Team Management
        </h2>
        <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20">
          Admin Portal
        </div>
      </div>

      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex gap-4 items-center mb-8">
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@company.com"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="w-48 relative">
          <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
          >
            <option value="DEVELOPER">Developer</option>
            <option value="PM">Project Manager</option>
            <option value="QA_VIEWER">QA / Viewer</option>
            <option value="BA_ANALYST">BA Analyst</option>
            <option value="BA_LEAD">BA Lead</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button
          onClick={handleInvite}
          disabled={isLoading || !email.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Invite User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">No members found.</td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                      {m.user.name?.charAt(0).toUpperCase() || m.user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{m.user.name}</div>
                      <div className="text-xs text-slate-400">{m.user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700">
                      {m.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${m.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {m.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-slate-500 hover:text-red-400 transition-colors" title="Remove User">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
