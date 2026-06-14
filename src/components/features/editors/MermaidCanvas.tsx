'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const MermaidCanvas = ({ chart, isProcessing }: { chart: string, isProcessing?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#0f172a',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#3b82f6',
        lineColor: '#64748b',
        secondaryColor: '#334155',
        tertiaryColor: '#1e293b'
      }
    });
  }, []);

  useEffect(() => {
    if (isProcessing || !chart || !containerRef.current) return;

    const renderChart = async () => {
      try {
        setError(null);
        // Extract mermaid code from markdown fences if present
        let cleanChart = chart;
        const match = chart.match(/```(?:mermaid|plantuml)?\s*([\s\S]*?)\s*```/i);
        if (match) {
          cleanChart = match[1].trim();
        }

        if (cleanChart.includes('[Generation Error:')) {
          setError(cleanChart);
          return;
        }

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanChart);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Force the SVG to its natural size instead of shrinking to fit
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = 'none';
            svgElement.style.height = 'auto';
            svgElement.style.width = '100%';
            svgElement.style.minWidth = '1200px'; // Prevent microscopic scaling for massive charts
          }
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError(err.message || 'Syntax Error rendering diagram');
      }
    };

    renderChart();
  }, [chart, isProcessing]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-2xl border border-slate-700/30 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Rendering Diagram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-slate-900/80 border border-red-500/30 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold uppercase tracking-widest text-sm">Visual Engine Fallback</h3>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed italic">The AI generated an invalid diagram format.</p>
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 max-h-32 overflow-y-auto custom-scrollbar font-mono">
          {error.includes('Generation Error') ? 'Service Unavailable - AI provider is busy. Please regenerate.' : error}
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <pre className="text-[11px] text-slate-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{chart}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-200px)] min-h-[600px] bg-slate-900 rounded-3xl border border-slate-700/50 overflow-hidden relative my-8 shadow-2xl p-8">
      <div ref={containerRef} className="w-full h-full overflow-auto custom-scrollbar block" />
      <div className="absolute top-4 right-4 pointer-events-none">
         <div className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded backdrop-blur-md shadow-sm">
           Standard UML View (Scrollable)
         </div>
      </div>
    </div>
  );
};
