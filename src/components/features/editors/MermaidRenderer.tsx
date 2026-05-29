import { useState, useEffect, useRef } from "react";
import mermaid from 'mermaid';
import { Loader2, AlertTriangle } from 'lucide-react';

export const MermaidRenderer = ({ chart, isProcessing }: { chart: string, isProcessing?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      logLevel: 5
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const handler = setTimeout(() => {
      const renderDiagram = async () => {
        if (containerRef.current && chart) {
          setError(null);
          try {
            // 1. Normalize and Clean (Non-destructive)
            let cleanChart = chart.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            
            if (!cleanChart.startsWith('graph') && !cleanChart.startsWith('flowchart') && !cleanChart.startsWith('sequenceDiagram') && !cleanChart.startsWith('classDiagram')) {
              cleanChart = 'graph TD\n' + cleanChart;
            }

            // 2. Unbreakable Global Scrubber
            cleanChart = cleanChart
              .replace(/[()]/g, ' ') // Scrub ALL parentheses from entire chart
              .replace(/--\s*".*?"\s*-->/g, ' --> ')
              .replace(/--\s*.*?\s*-->/g, ' --> ')
              .replace(/-\..*?\.-?->/g, ' --> ')
              .replace(/-\.->/g, ' --> ')
              .replace(/\[\s*"(.*?)"\s*\]/g, '["$1"]')
              .replace(/\{\s*"(.*?)"\s*\}/g, '{"$1"}');

            // Wrap subgraph titles in quotes if they contain special characters
            cleanChart = cleanChart.replace(/subgraph\s+([^\n{]+)/gi, (m, title) => {
               const trimmedTitle = title.trim();
               if (trimmedTitle.startsWith('"') && trimmedTitle.endsWith('"')) return m;
               return `subgraph "${trimmedTitle.replace(/"/g, "'").replace(/[()]/g, "")}"`;
            });

            // 2. Safe Syntax Hardening: Strip illegal spaces and ensure clean quoting
            cleanChart = cleanChart.replace(/([a-zA-Z0-9_]+)\s*\[[ \t]*"?(.*?)"?[ \t]*\]/g, '$1["$2"]');
            cleanChart = cleanChart.replace(/([a-zA-Z0-9_]+)\s*\{[ \t]*"?(.*?)"?[ \t]*\}/g, '$1{"$2"}');
            cleanChart = cleanChart.replace(/([a-zA-Z0-9_]+)\s*\([ \t]*"?(.*?)"?[ \t]*\)/g, '$1("$2")');
            
            // Final Header Guard
            if (cleanChart.toLowerCase().includes('graph id')) {
              cleanChart = cleanChart.replace(/graph\s+id/gi, 'graph TD');
            }

            // 3. Clear previous content
            containerRef.current.innerHTML = '';
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            
            // 4. Render
            const { svg } = await mermaid.render(id, cleanChart);
            if (containerRef.current && isMounted) {
              const responsiveSvg = svg.replace(/max-width:\s*[^;]+;?/gi, '').replace(/width:\s*100%;?/gi, '');
              containerRef.current.innerHTML = responsiveSvg;
            }
          } catch (err: any) {
            console.error('Mermaid render error:', err);
            if (isMounted) setError(err.message || 'Syntax Error');
          }
        }
      };
      renderDiagram();
    }, 1000); // 1-second debounce to handle streaming AI output

    return () => { isMounted = false; clearTimeout(handler); };
  }, [chart]);

  if (error) {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-2xl border border-slate-700/30 min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Drawing Flowchart...</p>
        </div>
      );
    }
    return (
      <div className="p-8 bg-slate-900/80 border border-red-500/30 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold uppercase tracking-widest text-sm">Visual Engine Fallback</h3>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed italic">The AI generated a complex process that the visual engine is struggling to draw. You can view the raw logic below.</p>
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 max-h-32 overflow-y-auto custom-scrollbar font-mono">
          {error}
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <pre className="text-[11px] text-slate-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{chart}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-10 flex justify-center bg-slate-900/30 rounded-3xl border border-slate-700/30 my-8 group relative transition-all hover:bg-slate-900/50">
      <div ref={containerRef} className="max-w-full" />
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded">
           Live Rendered
         </div>
      </div>
    </div>
  );
};
