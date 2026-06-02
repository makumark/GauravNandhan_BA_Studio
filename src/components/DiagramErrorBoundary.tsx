"use client";
import React from 'react';

interface State { hasError: boolean; error?: string; }

export class DiagramErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: string }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('DiagramErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-center gap-3">
          <div className="text-red-400 text-2xl">⚠️</div>
          <p className="text-sm font-bold text-red-400">Diagram render failed</p>
          <p className="text-xs text-slate-500">{this.state.error || 'The AI returned invalid diagram syntax.'}</p>
          <p className="text-xs text-slate-600 italic">Please click the Edit button to view or fix the raw source.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-red-500/20"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
