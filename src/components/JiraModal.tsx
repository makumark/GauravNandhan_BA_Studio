"use client";

import { useState, useEffect } from 'react';
import { X, Send, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JiraModalProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  docContent: string;
}

export function JiraModal({ isOpen, onClose, docTitle, docContent }: JiraModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ key: string, url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setSuccess(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    siteUrl: '',
    email: '',
    apiToken: '',
    projectKey: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrate/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          title: `[BA Studio] ${docTitle}`,
          content: docContent
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync with Jira');
      setSuccess({ key: data.issueKey, url: data.issueUrl });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-600/20 to-transparent">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                Sync to Jira Cloud
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <ExternalLink className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-white">Successfully Synced!</h4>
                  <p className="text-slate-400 text-sm">Issue <span className="font-mono text-blue-400">{success.key}</span> has been created in Jira.</p>
                  <a 
                    href={success.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
                  >
                    View in Jira <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={onClose} className="block w-full text-slate-500 hover:text-slate-300 text-sm">Close</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Jira Site URL</label>
                    <input 
                      required
                      type="url"
                      placeholder="https://your-domain.atlassian.net"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.siteUrl}
                      onChange={e => setFormData({...formData, siteUrl: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                      <input 
                        required
                        type="email"
                        placeholder="user@company.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Project Key</label>
                      <input 
                        required
                        type="text"
                        placeholder="PROJ"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.projectKey}
                        onChange={e => setFormData({...formData, projectKey: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">API Token</label>
                    <input 
                      required
                      type="password"
                      placeholder="Your Atlassian API Token"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.apiToken}
                      onChange={e => setFormData({...formData, apiToken: e.target.value})}
                    />
                    <p className="text-[10px] text-slate-500 mt-1 italic">Generated in your Atlassian Account settings.</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Push to Jira"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
