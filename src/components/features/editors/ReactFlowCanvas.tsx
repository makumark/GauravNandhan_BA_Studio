'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const ReactFlowCanvas = ({ chart, isProcessing }: { chart: string, isProcessing?: boolean }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  useEffect(() => {
    if (!chart || isProcessing) return;

    try {
      // Parse LLM generated JSON
      let jsonStr = chart;
      const jsonMatch = chart.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else {
        const startIdx = chart.indexOf('{');
        const endIdx = chart.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          jsonStr = chart.substring(startIdx, endIdx + 1).trim();
        }
      }

      const parsed = JSON.parse(jsonStr);
      
      if (parsed.code) {
         // LLM might wrap in the { code: "..." } structure as requested in route.ts
         const innerParsed = JSON.parse(parsed.code);
         if (innerParsed.nodes) setNodes(innerParsed.nodes);
         if (innerParsed.edges) setEdges(innerParsed.edges);
      } else {
         if (parsed.nodes) setNodes(parsed.nodes);
         if (parsed.edges) setEdges(parsed.edges);
      }
      setError(null);
    } catch (err: any) {
      console.error('ReactFlow parse error:', err);
      // Wait for complete stream before showing error if it's currently streaming
      if (!isProcessing) {
        setError(err.message || 'Syntax Error rendering canvas');
      }
    }
  }, [chart, isProcessing, setNodes, setEdges]);

  if (error && !isProcessing) {
    return (
      <div className="p-8 bg-slate-900/80 border border-red-500/30 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold uppercase tracking-widest text-sm">Visual Engine Fallback</h3>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed italic">The AI generated an invalid component layout JSON.</p>
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 max-h-32 overflow-y-auto custom-scrollbar font-mono">
          {error}
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <pre className="text-[11px] text-slate-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{chart}</pre>
        </div>
      </div>
    );
  }

  if (isProcessing && nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-2xl border border-slate-700/30 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Rendering Canvas...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-slate-900 rounded-3xl border border-slate-700/50 overflow-hidden relative my-8 shadow-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-slate-900"
      >
        <Controls className="bg-slate-800 text-slate-300 border-slate-700" />
        <MiniMap 
          nodeColor={(n) => {
            if (n.style?.background) return n.style.background.toString();
            return '#1e293b';
          }}
          className="bg-slate-800 border-slate-700" 
          maskColor="rgba(15, 23, 42, 0.7)"
        />
        <Background color="#334155" gap={16} />
      </ReactFlow>
      
      <div className="absolute top-4 right-4 pointer-events-none">
         <div className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded backdrop-blur-md">
           Interactive Canvas
         </div>
      </div>
    </div>
  );
};
