"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content })
      });
      if (res.ok) {
        setSuccess(true);
        setName('');
        setContent('');
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
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

        <form onSubmit={handleSubmit} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-6">
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
            {loading ? <span className="animate-pulse">Saving...</span> : success ? <><Check className="w-5 h-5"/> Uploaded Successfully</> : <><Upload className="w-5 h-5"/> Save Template</>}
          </button>
        </form>
      </div>
    </div>
  );
}
