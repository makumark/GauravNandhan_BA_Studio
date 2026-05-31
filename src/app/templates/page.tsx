"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, ArrowLeft, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const url = editingId ? `/api/templates/${editingId}` : '/api/templates';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content })
      });
      if (res.ok) {
        setSuccess(true);
        if (!editingId) {
           setName('');
           setContent('');
        }
        fetchTemplates(); // Refresh list after saving
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save template. Please check database connection.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setName(t.name);
    setContent(t.content);
    setSuccess(false);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (editingId === id) {
           setEditingId(null);
           setName('');
           setContent('');
        }
        fetchTemplates();
      } else {
        alert('Failed to delete template.');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Studio Dashboard
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            Corporate Templates
          </h1>
          <p className="text-slate-400 mt-2">Upload your custom document structures to force the AI to adhere to your compliance formats.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-6 h-fit relative">
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setName(''); setContent(''); setSuccess(false); }}
                className="absolute top-6 right-6 text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                Cancel Edit
              </button>
            )}
            <h2 className="text-xl font-semibold mb-4 border-b border-slate-700 pb-2">
              {editingId ? "Edit Template" : "Upload New Template"}
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Template Name</label>
              <input 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Acme Corp standard BRD v2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Template Structure (Markdown)</label>
              <textarea 
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={12}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm text-slate-300"
                placeholder="# 1. Executive Summary\n[Insert Summary Here]\n\n# 2. Business Objectives\n..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                <span className="font-bold flex items-center gap-2">⚠️ Error Saving Template</span>
                <p className="mt-1">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <span className="animate-pulse">Saving...</span> : success ? <><Check className="w-5 h-5"/> {editingId ? "Updated Successfully" : "Uploaded Successfully"}</> : <><Upload className="w-5 h-5"/> {editingId ? "Update Template" : "Save Template"}</>}
            </button>
          </form>

          <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
             <h2 className="text-xl font-semibold mb-4 border-b border-slate-700 pb-2">Saved Templates</h2>
             {fetching ? (
                <div className="text-slate-400 text-sm animate-pulse">Loading templates...</div>
             ) : templates.length === 0 ? (
                <div className="text-slate-500 text-sm italic p-4 text-center bg-slate-900/50 rounded-lg border border-slate-800">No templates found. Upload one to get started.</div>
             ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                   {templates.map(t => (
                      <div key={t.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                         <div className="flex items-start justify-between">
                           <h3 className="font-bold text-blue-400">
                              {t.name}
                           </h3>
                           <div className="flex items-center gap-2">
                             <button onClick={() => handleEdit(t)} className="text-slate-400 hover:text-blue-400 p-1 transition-colors" title="Edit Template">
                               <Edit className="w-4 h-4" />
                             </button>
                             <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-400 p-1 transition-colors" title="Delete Template">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                         <p className="text-xs text-slate-500 mt-1 mb-3">Saved on {new Date(t.createdAt).toLocaleDateString()}</p>
                         <pre className="text-[10px] text-slate-400 font-mono bg-slate-950 p-3 rounded-lg overflow-hidden max-h-32 text-ellipsis line-clamp-6">
                            {t.content}
                         </pre>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
