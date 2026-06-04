"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, X, ChevronRight, Network, ZoomIn, ZoomOut } from "lucide-react";
import { GraphNodeData, GraphEdgeData } from "@/lib/graph";

interface TraceabilityCanvasProps {
  graphNodes: GraphNodeData[];
  graphEdges: GraphEdgeData[];
  staleDocs: Set<string>;
  /** Called when user clicks Regenerate on a stale upstream node */
  onRegenerateDoc: (docName: string) => void;
  /** All document tab contents so we can show full requirement text */
  documents: Record<string, { content: string }>;
}

// ── Layout constants ──────────────────────────────────────────────────────────
// We arrange nodes in columns by type, left-to-right
const TYPE_ORDER: Record<string, number> = {
  REQUIREMENT: 0,
  FEATURE:     0,
  EPIC:        0,
  SCREEN:      1,
  API:         1,
  TEST_CASE:   2,
  DOCUMENT:    3,
};
const NODE_W  = 160;
const NODE_H  = 72;
const COL_GAP = 220;
const ROW_GAP = 90;
const CANVAS_PAD = 40;

function typeColor(type: string) {
  switch (type) {
    case 'REQUIREMENT':
    case 'FEATURE':
    case 'EPIC':      return { stroke: '#6366f1', bg: '#1e1b4b', text: '#a5b4fc', dot: '#6366f1' };
    case 'SCREEN':    return { stroke: '#3b82f6', bg: '#0c2a45', text: '#93c5fd', dot: '#3b82f6' };
    case 'API':       return { stroke: '#06b6d4', bg: '#0c2a30', text: '#67e8f9', dot: '#06b6d4' };
    case 'TEST_CASE': return { stroke: '#10b981', bg: '#052e1a', text: '#6ee7b7', dot: '#10b981' };
    default:          return { stroke: '#475569', bg: '#1e293b', text: '#94a3b8', dot: '#475569' };
  }
}

function layoutNodes(nodes: GraphNodeData[]) {
  // Sort nodes into columns by type
  const cols: GraphNodeData[][] = [[], [], [], []];
  nodes.forEach(n => {
    const col = TYPE_ORDER[n.nodeType] ?? 3;
    cols[col].push(n);
  });

  const positioned: Record<string, { x: number; y: number }> = {};
  cols.forEach((col, ci) => {
    col.forEach((node, ri) => {
      positioned[node.nodeId] = {
        x: CANVAS_PAD + ci * COL_GAP,
        y: CANVAS_PAD + ri * ROW_GAP,
      };
    });
  });

  const maxRows = Math.max(...cols.map(c => c.length), 1);
  return { positioned, width: CANVAS_PAD * 2 + 3 * COL_GAP + NODE_W, height: CANVAS_PAD * 2 + maxRows * ROW_GAP };
}

function wrapText(text: string, maxLen = 22) {
  if (text.length <= maxLen) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxLen) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 3);
}

// ── Find which document tab covers this graph node ─────────────────────────
const DOC_TAB_MAP: Record<string, string> = {
  REQUIREMENT: 'FRD',
  FEATURE:     'FRD',
  EPIC:        'BRD',
  SCREEN:      'Wireframes',
  API:         'SRD',
  TEST_CASE:   'Test Cases',
  DOCUMENT:    'BRD',
};

// Map stale docs to node types to figure out which nodes are stale
const STALE_DOC_TO_TYPES: Record<string, string[]> = {
  'FRD':         ['REQUIREMENT', 'FEATURE'],
  'BRD':         ['EPIC', 'DOCUMENT'],
  'Wireframes':  ['SCREEN'],
  'Prototypes':  ['SCREEN'],
  'Test Cases':  ['TEST_CASE'],
  'UML Diagrams':['API'],
  'SRD':         ['API'],
};

// Which documents to cascade-regen when a node type triggers regeneration
const CASCADE_DOCS: Record<string, string[]> = {
  REQUIREMENT: ['FRD', 'Wireframes', 'Prototypes', 'UML Diagrams', 'Flowcharts', 'Test Cases'],
  FEATURE:     ['FRD', 'Wireframes', 'Prototypes', 'Test Cases'],
  SCREEN:      ['Wireframes', 'Prototypes', 'Test Cases'],
  API:         ['SRD', 'UML Diagrams', 'Test Cases'],
  TEST_CASE:   ['Test Cases'],
  EPIC:        ['BRD', 'FRD', 'Wireframes', 'Test Cases'],
};

export function TraceabilityCanvas({
  graphNodes,
  graphEdges,
  staleDocs,
  onRegenerateDoc,
  documents,
}: TraceabilityCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const { positioned, width, height } = layoutNodes(graphNodes);

  // ── Determine which nodes are stale via staleDocs ─────────────────────────
  const staleNodeIds = new Set<string>();
  staleDocs.forEach(doc => {
    const types = STALE_DOC_TO_TYPES[doc] ?? [];
    graphNodes.forEach(n => {
      if (types.includes(n.nodeType)) staleNodeIds.add(n.nodeId);
    });
  });

  // ── Graph traversal helpers ───────────────────────────────────────────────
  const getUpstream = useCallback((nodeId: string) =>
    graphEdges
      .filter(e => e.to === nodeId)
      .map(e => graphNodes.find(n => n.nodeId === e.from))
      .filter(Boolean) as GraphNodeData[],
    [graphEdges, graphNodes]
  );

  const getDownstream = useCallback((nodeId: string) =>
    graphEdges
      .filter(e => e.from === nodeId)
      .map(e => graphNodes.find(n => n.nodeId === e.to))
      .filter(Boolean) as GraphNodeData[],
    [graphEdges, graphNodes]
  );

  // ── Cascade regen: regenerate primary doc + all downstream visual docs ────
  const handleRegenNode = (node: GraphNodeData) => {
    const primaryDoc = DOC_TAB_MAP[node.nodeType] || 'FRD';
    const cascade = CASCADE_DOCS[node.nodeType] ?? [primaryDoc];
    // Trigger each doc one by one (page.tsx handleDocumentClick queues them)
    cascade.forEach(doc => onRegenerateDoc(doc));
  };

  if (graphNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
          <Network className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-slate-500 text-sm font-medium mb-1">No graph data yet</p>
        <p className="text-slate-600 text-xs max-w-xs">
          Submit your first requirement and the AI will automatically build a traceability graph of all artifacts.
        </p>
      </div>
    );
  }

  const svgW = width  * zoom;
  const svgH = height * zoom;

  return (
    <div className="flex gap-4 h-full min-h-[520px]">
      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-slate-900/40 border border-slate-700/50 rounded-3xl backdrop-blur overflow-auto relative">
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}
            className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.5))}
            className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)}
            className="px-3 h-8 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white text-[10px] font-bold transition-colors">
            Reset
          </button>
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-4 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 flex-wrap">
          {[
            { type: 'REQUIREMENT', label: 'Requirement' },
            { type: 'SCREEN',      label: 'Screen'      },
            { type: 'API',         label: 'API'         },
            { type: 'TEST_CASE',   label: 'Test Case'   },
          ].map(({ type, label }) => {
            const c = typeColor(type);
            return (
              <div key={type} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <div className="w-2.5 h-2.5 rounded-sm border" style={{ background: c.bg, borderColor: c.stroke }} />
                {label}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 text-[10px] text-red-400">
            <div className="w-2.5 h-2.5 rounded-sm border border-red-400 bg-red-950/60 animate-pulse" />
            Stale
          </div>
        </div>

        <svg ref={svgRef} width={svgW} height={svgH} viewBox={`0 0 ${width} ${height}`}
          style={{ width: svgW, height: svgH, cursor: 'default' }}>
          <defs>
            <marker id="tc-arrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L0,5 L7,2.5 z" fill="#475569" />
            </marker>
            <marker id="tc-arrow-stale" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L0,5 L7,2.5 z" fill="#ef4444" />
            </marker>
            <filter id="glow-node">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {graphEdges.map(edge => {
            const fp = positioned[edge.from];
            const tp = positioned[edge.to];
            if (!fp || !tp) return null;
            const x1 = fp.x + NODE_W, y1 = fp.y + NODE_H / 2;
            const x2 = tp.x,         y2 = tp.y + NODE_H / 2;
            const cx = (x1 + x2) / 2;
            const isEdgeStale = staleNodeIds.has(edge.from) || staleNodeIds.has(edge.to);
            return (
              <path key={`${edge.from}-${edge.to}`}
                d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={isEdgeStale ? '#ef4444' : '#334155'}
                strokeWidth={isEdgeStale ? 1.8 : 1.4}
                strokeDasharray={isEdgeStale ? '5,3' : undefined}
                markerEnd={isEdgeStale ? 'url(#tc-arrow-stale)' : 'url(#tc-arrow)'}
                opacity={isEdgeStale ? 0.8 : 0.6}
              />
            );
          })}

          {/* Nodes */}
          {graphNodes.map(node => {
            const pos = positioned[node.nodeId];
            if (!pos) return null;
            const c = typeColor(node.nodeType);
            const isStale    = staleNodeIds.has(node.nodeId);
            const isSelected = selectedNode?.nodeId === node.nodeId;
            const lines = wrapText(node.nodeId + ' · ' + node.label, 22);

            return (
              <g key={node.nodeId}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNode(isSelected ? null : node)}
                style={{ cursor: 'pointer' }}>

                {/* Selection ring */}
                {isSelected && (
                  <rect x={-3} y={-3} width={NODE_W + 6} height={NODE_H + 6} rx={14} ry={14}
                    fill="none" stroke={c.stroke} strokeWidth={2} opacity={0.5}
                    filter="url(#glow-node)" />
                )}

                {/* Main rect */}
                <rect width={NODE_W} height={NODE_H} rx={10} ry={10}
                  fill={c.bg}
                  stroke={isStale ? '#ef4444' : isSelected ? c.stroke : c.stroke}
                  strokeWidth={isStale ? 2.2 : isSelected ? 2 : 1.5}
                  opacity={isSelected ? 1 : 0.9}
                  style={isStale ? { animation: 'pulse-stroke 1.4s ease-in-out infinite' } : undefined}
                />

                {/* Type label bar */}
                <rect x={0} y={0} width={NODE_W} height={18} rx={10} ry={10} fill={c.stroke} opacity={0.18} />
                <rect x={0} y={10} width={NODE_W} height={8} fill={c.stroke} opacity={0.18} />
                <text x={NODE_W / 2} y={13} textAnchor="middle"
                  style={{ fontSize: 8, fontWeight: 800, fontFamily: 'Inter,sans-serif', fill: c.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {node.nodeType.replace('_', ' ')}
                </text>

                {/* Content lines */}
                {lines.map((line, li) => (
                  <text key={li} x={8} y={30 + li * 14} textAnchor="start"
                    style={{ fontSize: li === 0 ? 10 : 9, fontWeight: li === 0 ? 700 : 400, fontFamily: 'Inter,sans-serif', fill: li === 0 ? '#e2e8f0' : '#94a3b8' }}>
                    {line}
                  </text>
                ))}

                {/* Stale badge */}
                {isStale && (
                  <g transform={`translate(${NODE_W - 12}, -6)`}>
                    <circle r={8} fill="#ef4444" />
                    <text x={0} y={4} textAnchor="middle"
                      style={{ fontSize: 9, fontWeight: 900, fill: 'white', fontFamily: 'Inter,sans-serif' }}>!</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Detail Panel ──────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 space-y-3">
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div key={selectedNode.nodeId}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 space-y-4">

              {/* Node header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-widest font-bold mb-1"
                    style={{ color: typeColor(selectedNode.nodeType).text }}>
                    {selectedNode.nodeType.replace('_', ' ')}
                  </div>
                  <div className="text-sm font-bold text-white">{selectedNode.nodeId}</div>
                </div>
                <div className="flex items-center gap-2">
                  {staleNodeIds.has(selectedNode.nodeId) && (
                    <span className="text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-lg animate-pulse">
                      STALE
                    </span>
                  )}
                  <button onClick={() => setSelectedNode(null)} className="text-slate-600 hover:text-slate-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Full text — the user can read the full requirement here without going to the doc */}
              <div>
                <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-2">Full Requirement Text</div>
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                  {selectedNode.label || 'No description available.'}
                </div>
              </div>

              {/* Upstream */}
              {getUpstream(selectedNode.nodeId).length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                    ↑ Upstream Dependencies
                  </div>
                  <div className="space-y-1.5">
                    {getUpstream(selectedNode.nodeId).map(u => {
                      const uc = typeColor(u.nodeType);
                      return (
                        <button key={u.nodeId} onClick={() => setSelectedNode(u)}
                          className="w-full flex items-start gap-2 px-2.5 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors text-left">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: uc.dot }} />
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-slate-300">{u.nodeId}</div>
                            <div className="text-[9px] text-slate-500 truncate">{u.label}</div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Downstream */}
              {getDownstream(selectedNode.nodeId).length > 0 && (
                <div>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                    ↓ Downstream Artifacts
                  </div>
                  <div className="space-y-1.5">
                    {getDownstream(selectedNode.nodeId).map(d => {
                      const dc = typeColor(d.nodeType);
                      const isDs = staleNodeIds.has(d.nodeId);
                      return (
                        <button key={d.nodeId} onClick={() => setSelectedNode(d)}
                          className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-xl transition-colors text-left border ${
                            isDs
                              ? 'bg-red-500/8 border-red-500/20 hover:bg-red-500/12'
                              : 'bg-slate-800/50 border-transparent hover:bg-slate-700/50'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isDs ? 'animate-pulse' : ''}`}
                            style={{ background: isDs ? '#ef4444' : dc.dot }} />
                          <div className="min-w-0">
                            <div className={`text-[10px] font-bold ${isDs ? 'text-red-300' : 'text-slate-300'}`}>{d.nodeId}</div>
                            <div className="text-[9px] text-slate-500 truncate">{d.label}</div>
                            {isDs && <div className="text-[9px] text-red-400 font-bold mt-0.5">Out of sync</div>}
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Regen button for stale node */}
              {staleNodeIds.has(selectedNode.nodeId) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <p className="text-[10px] text-red-300 leading-snug font-bold">
                      This artifact and its downstream chain are out of sync.
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Regenerating will also update: {(CASCADE_DOCS[selectedNode.nodeType] ?? []).join(', ')}
                  </p>
                  <button
                    onClick={() => handleRegenNode(selectedNode)}
                    className="w-full py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-3 h-3" />
                    Regenerate All Downstream
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-slate-900/40 border border-slate-700/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-48">
              <Network className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-slate-500 text-xs font-medium mb-1">Click any node</p>
              <p className="text-slate-600 text-[10px]">
                to see its full requirement text, upstream dependencies, and downstream artifacts
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Graph stats */}
        <div className="bg-slate-900/40 border border-slate-700/40 rounded-2xl p-4 space-y-2.5">
          <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Graph Summary</div>
          {[
            { label: 'Nodes', value: graphNodes.length, color: 'text-white' },
            { label: 'Links', value: graphEdges.length, color: 'text-blue-400' },
            { label: 'Stale', value: staleNodeIds.size, color: staleNodeIds.size > 0 ? 'text-red-400' : 'text-emerald-400' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">{row.label}</span>
              <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
