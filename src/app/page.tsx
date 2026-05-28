"use client";

import { DynamicUIBuilder } from '@/components/DynamicUIBuilder';

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Brain, 
  Bot, 
  User, 
  Send, 
  Plus, 
  FileText, 
  Play, 
  Code, 
  GitBranch, 
  AlignLeft, 
  LayoutDashboard, 
  Download, 
  Save, 
  Settings, 
  LogOut, 
  Loader2, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Check,
  Clock, 
  Shield, 
  Search, 
  ExternalLink,
  Rocket,
  Target,
  BarChart3,
  Copy,
  MessageSquare,
  Mic,
  Share2,
  Link as LinkIcon,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Printer,
  Edit3,
  Paperclip,
  X,
  LogIn,
  Zap,
  ZapOff,
  FileQuestion,
  Activity,
  ChevronDown,
  History,
  FileDown,
  Trash2,
  Info,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { CollaborativeEditor } from '@/components/CollaborativeEditor';
import remarkGfm from 'remark-gfm';
import pako from 'pako';
import { AuthModal } from "@/components/AuthModal";
import { JiraModal } from "@/components/JiraModal";
import { calculateDelta } from "@/lib/versioning";
import {
  buildInMemoryGraph,
  traverseDownstream,
  type GraphNodeData,
  type GraphEdgeData,
  type InMemoryGraph,
} from "@/lib/graph";


import mermaid from 'mermaid';

// ── Professional Client-side Mermaid Renderer ──────────────────
const MermaidRenderer = ({ chart, isProcessing }: { chart: string, isProcessing?: boolean }) => {
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

// ── PlantUML Encoder (pako deflate + PlantUML custom base64) ──────────────────
function encodePlantUML(code: string): string {
  const encode6bit = (b: number): string => {
    if (b < 10) return String.fromCharCode(48 + b);
    b -= 10;
    if (b < 26) return String.fromCharCode(65 + b);
    b -= 26;
    if (b < 26) return String.fromCharCode(97 + b);
    b -= 26;
    if (b === 0) return '-';
    if (b === 1) return '_';
    return '?';
  };
  const append3bytes = (b1: number, b2: number, b3: number): string => {
    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3f;
    return encode6bit(c1 & 0x3f) + encode6bit(c2 & 0x3f) + encode6bit(c3 & 0x3f) + encode6bit(c4 & 0x3f);
  };
  try {
    const compressed = pako.deflate(new TextEncoder().encode(code), { level: 9 });
    let result = '';
    for (let i = 0; i < compressed.length; i += 3) {
      if (i + 2 < compressed.length) {
        result += append3bytes(compressed[i], compressed[i + 1], compressed[i + 2]);
      } else if (i + 1 < compressed.length) {
        result += append3bytes(compressed[i], compressed[i + 1], 0);
      } else {
        result += append3bytes(compressed[i], 0, 0);
      }
    }
    return result;
  } catch (e) {
    return '';
  }
}

function PlantUMLRenderer({ code, isProcessing }: { code: string, isProcessing?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [debouncedCode, setDebouncedCode] = useState('');

  // Debounce the code so we only render once the AI has finished streaming
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
    const delay = isProcessing ? 4000 : 300;
    const handler = setTimeout(() => {
      const umlMatch = code.match(/@startuml[\s\S]*?@enduml/i);
      const cleanCode = umlMatch ? umlMatch[0].trim() : code.trim();
      if (cleanCode.length > 20) setDebouncedCode(cleanCode);
    }, delay);
    return () => clearTimeout(handler);
  }, [code, isProcessing]);

  // Show generating spinner while AI is streaming
  if (isProcessing && !debouncedCode) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-2xl border border-slate-700/50 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Generating UML Diagram...</p>
      </div>
    );
  }

  if (!debouncedCode) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-2xl border border-slate-700/50 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Preparing diagram...</p>
      </div>
    );
  }

  const encoded = encodePlantUML(debouncedCode);
  const plantUMLImgUrl = encoded ? `https://www.plantuml.com/plantuml/svg/~1${encoded}` : '';
  const plantUMLEditUrl = encoded ? `https://www.plantuml.com/plantuml/uml/~1${encoded}` : '';

  if (!encoded) {
    return (
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{debouncedCode}</pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Rendered diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-x-auto custom-scrollbar relative">
        {/* Loading overlay for image */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-slate-400 text-sm">Rendering diagram...</p>
            </div>
          </div>
        )}
        {imgError ? (
          <div className="p-8 flex flex-col gap-4 items-center">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
            <p className="text-slate-600 text-sm font-medium">Diagram rendering failed.</p>
            <a
              href={plantUMLEditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open in PlantUML Editor ↗
            </a>
          </div>
        ) : (
          <img
            src={plantUMLImgUrl}
            alt="UML Diagram"
            className="w-full h-auto p-6"
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
          />
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3 flex-wrap">
        <a
          href={plantUMLEditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold rounded-lg hover:bg-blue-600/30 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open & Edit in PlantUML Editor
        </a>
        <span className="text-slate-600 text-xs">Rendered via PlantUML.com — no external timeouts</span>
      </div>

      {/* Collapsible raw source */}
      <details className="bg-slate-950 rounded-xl border border-slate-800 group">
        <summary className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors list-none">
          <Code className="w-3.5 h-3.5" />
          PlantUML Source
          <ChevronDown className="w-3.5 h-3.5 ml-auto group-open:rotate-180 transition-transform" />
        </summary>
        <pre className="p-4 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto custom-scrollbar border-t border-slate-800">{debouncedCode}</pre>
      </details>
    </div>
  );
}

function LivePreviewIframe({ htmlContent, isProcessing, summary }: { htmlContent: string, isProcessing?: boolean, summary: string }) {
  const [debouncedHtml, setDebouncedHtml] = useState(htmlContent);

  useEffect(() => {
    const delay = isProcessing ? 2000 : 50;
    const handler = setTimeout(() => {
      setDebouncedHtml(htmlContent);
    }, delay);
    return () => clearTimeout(handler);
  }, [htmlContent, isProcessing]);

  let fullHtml = debouncedHtml;
  
  // 1. DAWN OF CODE: Detect dangling scripts that aren't wrapped in <script>
  // GUARD: Only trigger if there are truly NO html tags (pure JS blob), not Alpine.js HTML
  if ((fullHtml.includes('function') || fullHtml.includes('const') || fullHtml.includes('let')) && !fullHtml.includes('<script') && !fullHtml.includes('<div') && !fullHtml.includes('<span') && !fullHtml.includes('x-data')) {
    const scriptRegex = /(function\s+\w+\(\)[\s\S]*?\n\s*\}\s*\n?)/g;
    const scripts = fullHtml.match(scriptRegex);
    if (scripts) {
      const scriptBlock = `<script>\n${scripts.join('\n')}\n</script>`;
      fullHtml = fullHtml.replace(scriptRegex, '') + '\n' + scriptBlock;
    }
  }

  if (!fullHtml.toLowerCase().includes('<html')) {
    fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <style>
          body { background: transparent; color: white; font-family: sans-serif; margin: 0; padding: 0; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.1); }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); border-radius: 10px; }
        </style>
      </head>
      <body class="custom-scrollbar">
        ${fullHtml}
      </body>
      </html>`.trim();
  } else {
    // Inject tailwind and alpine if missing
    if (!fullHtml.includes('tailwindcss.com')) {
      fullHtml = fullHtml.replace(/<\/head>/i, '<script src="https://cdn.tailwindcss.com"></script>\n</head>');
    }
    if (!fullHtml.includes('alpinejs')) {
      fullHtml = fullHtml.replace(/<\/head>/i, '<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>\n</head>');
    }
    // If <head> wasn't found to replace (malformed HTML), prepend to body
    if (!fullHtml.includes('tailwindcss.com')) {
      fullHtml = fullHtml.replace(/<body[^>]*>/i, '$&\n<script src="https://cdn.tailwindcss.com"></script>\n<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>');
    }
  }

  if (isProcessing && debouncedHtml.length < 50) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Generating User Interface...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6 h-full">
      {summary && summary.length > 20 && (
        <div className="prose prose-invert prose-slate max-w-none p-6 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
        </div>
      )}
      <div className="my-2 border border-slate-700 rounded-xl overflow-hidden bg-[#0f172a] shadow-2xl h-[calc(100vh-32rem)] min-h-[600px] relative">
        <iframe 
          srcDoc={fullHtml} 
          className="w-full h-full border-none" 
          title="Prototype Preview" 
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
          onLoad={(e) => {
            const win = (e.target as HTMLIFrameElement).contentWindow;
            if (win) {
              win.document.body.onclick = () => win.focus();
              win.addEventListener('click', (ev: any) => {
                const link = ev.target.closest('a');
                if (link) {
                  const href = link.getAttribute('href');
                  if (!href || href === '#' || href === '' || href.startsWith('/')) {
                    ev.preventDefault();
                  }
                }
              });
              win.addEventListener('submit', (ev: any) => {
                ev.preventDefault();
              });
            }
          }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [momInput, setMomInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Chat");
  const [docsReady, setDocsReady] = useState(false);
  const [documents, setDocuments] = useState<Record<string, { content: string, confidence?: number, review?: string, reason?: string, links?: string[] }>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [pastProjects, setPastProjects] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectSelectionModalOpen, setIsProjectSelectionModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [staleDocs, setStaleDocs] = useState<Set<string>>(new Set());

  // ── Brain 1: Session State Machine ──────────────────────────────
  const [sessionState, setSessionState] = useState<'INTAKE' | 'QUESTIONING' | 'READY'>('INTAKE');
  const [readinessScore, setReadinessScore] = useState(0);
  const [feasibilityIssues, setFeasibilityIssues] = useState<string[]>([]);
  const [contradictions, setContradictions] = useState<string[]>([]);
  const [regulatoryFlags, setRegulatoryFlags] = useState<string[]>([]);
  const [domainDetected, setDomainDetected] = useState('');
  const [smeInsight, setSmeInsight] = useState('');
  const [readinessChecklist, setReadinessChecklist] = useState<Record<string, boolean>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [billionDollarDisruptions, setBillionDollarDisruptions] = useState<any[]>([]);
  const [questionRoundCount, setQuestionRoundCount] = useState(0);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [scopeHistory, setScopeHistory] = useState<{snapshot: any[], impact?: any, timestamp: string}[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);
  
  const [strategicMoats, setStrategicMoats] = useState<any[]>([]);
  const [impactScore, setImpactScore] = useState<any>(null);
  const [logicAlerts, setLogicAlerts] = useState<any[]>([]);
  const [requirementGaps, setRequirementGaps] = useState<any[]>([]);
  const [playwrightScript, setPlaywrightScript] = useState<string | null>(null);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [terraformPlan, setTerraformPlan] = useState<string | null>(null);
  const [isGeneratingIaC, setIsGeneratingIaC] = useState(false);

  // ── Semantic Graph State (in-memory, zero cost) ───────────────────────────────────────────────────────────────────────
  // Stores the current session's graph nodes and edges as plain JS objects.
  // buildInMemoryGraph() converts these into an adjacency map for BFS traversal.
  // Works for ALL users (logged in or not) — no DB required for traversal.
  const [graphNodes, setGraphNodes] = useState<GraphNodeData[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdgeData[]>([]);
  // Latest traversal result — populated after each requirement change
  const [lastTraversalPaths, setLastTraversalPaths] = useState<{from:string;to:string;relationship:string}[]>([]);
  const [lastAffectedNodes, setLastAffectedNodes] = useState<GraphNodeData[]>([]);
  const [showGraphImpactModal, setShowGraphImpactModal] = useState(false);

  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    {
      role: "assistant",
      content: "Hello! I am Gaurav Nandhan BA Studio. I can help you create BRD, FRD, PRD, SRD, Wireframes, UML Diagrams, and Test Cases. Please paste your Minutes of Meeting (MOM) to begin, and let me know the domain you're targeting."
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Brain 1: Feasibility & Completeness Analysis ─────────────────
  const runAnalysis = async (userMessage: string) => {
    setIsAnalyzing(true);
    const newRound = questionRoundCount + 1;
    setQuestionRoundCount(newRound);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          history: chatMessages, // Send full history for version tracking
          round: newRound,
          projectId: currentProjectId ?? undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Analysis API failed with status ${res.status}`);
      }
      const data = await res.json();
      setSessionState(data.sessionState || 'QUESTIONING');
      setReadinessScore(data.readinessScore || 0);
      setFeasibilityIssues(data.feasibilityIssues || []);
      setContradictions(data.contradictions || []);
      setConflicts(data.conflicts || []);
      setRegulatoryFlags(data.regulatoryFlags || []);
      setDomainDetected(data.domainDetected || '');
      setSmeInsight(data.smeInsight || '');
      setBillionDollarDisruptions(data.billionDollarDisruptions || []);
      setReadinessChecklist(data.readinessChecklist || {});
      setStrategicMoats(data.strategicMoats || []);
      setImpactScore(data.impactScore || null);
      setLogicAlerts(data.logicAlerts || []);
      setRequirementGaps(data.requirementGaps || []);
      
      // Impact Analysis Logic (Sovereign Versioning Engine)
      if (data.snapshot) {
        const prevVersion = scopeHistory.length > 0 ? scopeHistory[scopeHistory.length - 1] : null;
        let impactReport = null;
        
        if (prevVersion) {
          impactReport = calculateDelta(
            prevVersion.snapshot, 
            data.snapshot, 
            domainDetected || 'General', 
            data.domainDetected || 'General'
          );
        }
        
        setScopeHistory(prev => [...prev, { 
          snapshot: data.snapshot, 
          impact: impactReport, 
          timestamp: new Date().toLocaleTimeString() 
        }]);

        // ── SEMANTIC GRAPH: Update in-memory graph from latest analysis response ────────
        const newNodes: GraphNodeData[] = data.graphNodes || [];
        const newEdges: GraphEdgeData[] = data.graphEdges || [];
        setGraphNodes(newNodes);
        setGraphEdges(newEdges);

        // ── SEMANTIC GRAPH: Precise stale-doc detection via BFS traversal ─────────────
        // Run BFS whenever ANY requirement changed (added, modified, or removed)
        if (
          impactReport &&
          ((impactReport.added?.length ?? 0) > 0 ||
           (impactReport.modified?.length ?? 0) > 0 ||
           (impactReport.removed?.length ?? 0) > 0)
        ) {
          const ir = impactReport; // narrowed local — not null from here
          const changedIds = [
            ...(ir.added?.map((a: any) => a.id) ?? []),
            ...(ir.modified?.map((m: any) => m.updated.id) ?? []),
            ...(ir.removed?.map((r: any) => r.id) ?? []),
          ];

          if (newNodes.length > 0 && changedIds.length > 0) {
            // Build adjacency map and run BFS — pure JS, zero cost
            const graph: InMemoryGraph = buildInMemoryGraph(newNodes, newEdges);
            const traversal = traverseDownstream(graph, changedIds);
            setLastTraversalPaths(traversal.traversalPaths);
            setLastAffectedNodes(traversal.affectedNodes);

            if (traversal.affectedDocTypes.length > 0) {
              // Precise: only flag documents that the graph says are downstream
              setStaleDocs(new Set(traversal.affectedDocTypes));
            } else if (ir.impactScore > 7 || ir.architecturalConflict) {
              // Fallback (same as before): broad staling only for high-impact changes
              setStaleDocs(new Set(['BRD', 'FRD', 'PRD', 'SRD', 'UML Diagrams', 'Wireframes', 'Prototypes', 'Regulatory Advisor']));
            }
          } else {
            // Legacy fallback: no graph data yet — use old link-based detection
            const changedSet = new Set(changedIds);
            const newlyStale = new Set<string>();
            Object.entries(documents).forEach(([name, doc]) => {
              if (doc.links && doc.links.some((linkId: string) => changedSet.has(linkId))) {
                newlyStale.add(name);
              }
            });
            if (newlyStale.size === 0 && (ir.impactScore > 7 || ir.architecturalConflict)) {
              setStaleDocs(new Set(['BRD', 'FRD', 'PRD', 'SRD', 'UML Diagrams', 'Wireframes', 'Prototypes', 'Regulatory Advisor']));
            } else if (newlyStale.size > 0) {
              setStaleDocs(prev => new Set([...Array.from(prev), ...Array.from(newlyStale)]));
            }
          }
        }
      }

      if (data.sessionState === 'READY') setDocsReady(true);
    } catch (e) {
      console.error('Brain 1 analysis error', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isProcessing]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/projects').then(res => res.json()).then(data => {
        if (Array.isArray(data)) {
          setPastProjects(data);
          if (!currentProjectId && data.length >= 0) {
            setIsProjectSelectionModalOpen(true);
          }
        }
      });
    }
  }, [session, currentProjectId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setMomInput(prev => prev + (prev ? '\n\n' : '') + `[File Content from ${file.name}]:\n${text}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        
        const newMessages = [...chatMessages, { role: "user", content: `Analyzing audio file: ${file.name}` }];
        setChatMessages(newMessages);

        runAnalysis(`Analyzing audio file: ${file.name}`);

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: newMessages, 
            audioData: base64Data,
            mimeType: file.type
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to process audio');

        setChatMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        setDocsReady(true);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Audio processing error:", error);
      alert(`Error processing audio: ${error.message}`);
    } finally {
      setIsProcessing(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleNewProject = () => {
    if (chatMessages.length > 1 && !currentProjectId) {
      if (!confirm("⚠️ You have unsaved work. Starting a new project will clear current progress. Continue?")) return;
    }
    
    // Clear all states
    setChatMessages([
      {
        role: "assistant",
        content: "Hello! I am ready for a new project. Please paste your Minutes of Meeting (MOM) or describe the requirements to begin."
      }
    ]);
    setDocuments({});
    setMomInput("");
    setDocsReady(false);
    setActiveTab("Chat");
    setCurrentProjectId(null);
    setSessionState('INTAKE');
    setReadinessScore(0);
    setFeasibilityIssues([]);
    setContradictions([]);
    setConflicts([]);
    setRegulatoryFlags([]);
    setDomainDetected("");
    setSmeInsight("");
    setReadinessChecklist({});
    setBillionDollarDisruptions([]);
    setQuestionRoundCount(0);
    setScopeHistory([]);
    setStrategicMoats([]);
    setImpactScore(null);
    setLogicAlerts([]);
    setRequirementGaps([]);
    setStaleDocs(new Set());
    // Reset semantic graph state
    setGraphNodes([]);
    setGraphEdges([]);
    setLastTraversalPaths([]);
    setLastAffectedNodes([]);
  };

  const handleSend = async () => {
    if (!momInput.trim()) return;
    
    const userText = momInput.trim();
    const newMessages = [...chatMessages, { role: "user", content: userText }];
    setChatMessages(newMessages);
    setMomInput("");
    setIsProcessing(true);

    // Brain 1: Always run analysis to keep intelligence panel and SME readiness updated
    runAnalysis(userText);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to communicate with AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      
      setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

      // Throttle UI updates to every 100ms to prevent browser hang during streaming
      let lastChatRender = 0;
      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined };
        if (done) {
          // Final flush
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = assistantContent;
            return updated;
          });
          break;
        }
        assistantContent += decoder.decode(value);
        const now = Date.now();
        if (now - lastChatRender > 100) {
          lastChatRender = now;
          const snapshot = assistantContent;
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = snapshot;
            return updated;
          });
        }
      }
      
      if (newMessages.length >= 1) {
        setDocsReady(true);
      }
      
      if (currentProjectId) {
         fetch(`/api/projects/${currentProjectId}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ messages: [...newMessages, { role: "assistant", content: assistantContent }] })
         }).catch(console.error);
      }
    } catch (error: any) {
      console.error("Error communicating with BA Agent:", error);
      setChatMessages(prev => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${error.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentClick = async (docName: string, force = false) => {
    if (!docsReady) return;
    
    setActiveTab(docName);
    setIsEditing(false);
    
    // If we already generated it and not forcing AND not stale, don't re-fetch
    if (documents[docName] && !force && !staleDocs.has(docName)) return;

    // Clear stale flag if we are about to regenerate
    if (staleDocs.has(docName)) {
      setStaleDocs(prev => {
        const next = new Set(prev);
        next.delete(docName);
        return next;
      });
    }

    setIsProcessing(true);
    let response: any;
    const functionalContext = documents['FRD']?.content || documents['PRD']?.content || documents['BRD']?.content || "";
    const designContext = docName === 'Prototypes' ? documents['Wireframes']?.content : "";
    const combinedContext = `${functionalContext}\n\n${designContext}`.trim();

    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: chatMessages, 
          documentRequested: docName, 
          sessionState, 
          readinessScore, 
          feasibilityIssues,
          functionalContext: btoa(encodeURIComponent(combinedContext))
        })
      });
      
      if (!response.ok) {
        const rawText = await response.text();
        let errorMsg = 'Failed to generate document';
        try {
          const errorData = JSON.parse(rawText);
          errorMsg = errorData.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let docContent = "";
      
        // Throttle UI updates to every 100ms to prevent browser hang during streaming
        let lastDocRender = 0;
        while (true) {
          const { done, value } = await reader?.read() || { done: true, value: undefined };
          if (done) {
            // Final flush so the complete content is always shown
            const finalContent = docContent;
            setDocuments(prev => ({ 
              ...prev, 
              [docName]: { ...prev[docName], content: finalContent } 
            }));
            break;
          }
          docContent += decoder.decode(value, { stream: true });
          const now = Date.now();
          if (now - lastDocRender > 100) {
            lastDocRender = now;
            const snapshot = docContent;
            setDocuments(prev => ({ 
              ...prev, 
              [docName]: { ...prev[docName], content: snapshot } 
            }));
          }
        }

        // Final Meta-Parsing: Extract from [CONFIDENCE: XX% | REVIEW: ... | LINKS: ... | REASON: ...]
        const metaMatch = docContent.match(/\[CONFIDENCE:\s*(\d+)%\s*\|\s*REVIEW:\s*(REQUIRED|OPTIONAL)\s*\|\s*LINKS:\s*([\s\S]*?)\s*\|\s*REASON:\s*([\s\S]*?)\]/i);

        if (metaMatch) {
          const confidence = parseInt(metaMatch[1]);
          const review = metaMatch[2].toUpperCase();
          const links = metaMatch[3].split(',').map(l => l.trim()).filter(l => l && l !== 'ID1' && l !== 'ID2');
          const reason = metaMatch[4].trim();
          
          // Clean the content (remove the metadata tag from the visible document)
          const cleanContent = docContent.replace(/\[CONFIDENCE:[\s\S]*?\]/gi, '').trim();

          setDocuments(prev => ({
            ...prev,
            [docName]: { 
              content: cleanContent, 
              confidence, 
              review, 
              reason,
              links
            }
          }));
        } else {
          // Fallback: If AI used separate tags or non-standard format
          const confMatch = docContent.match(/CONFIDENCE:\s*(\d+)%/i);
          const reviewMatch = docContent.match(/REVIEW:\s*(REQUIRED|OPTIONAL)/i);
          const linksMatch = docContent.match(/LINKS:\s*([^\]|]*)/i);
          const reasonMatch = docContent.match(/REASON:\s*([^\]|]*)/i);

          if (confMatch || reviewMatch || linksMatch) {
             setDocuments(prev => ({
              ...prev,
              [docName]: { 
                ...prev[docName],
                confidence: confMatch ? parseInt(confMatch[1]) : 100, 
                review: reviewMatch ? reviewMatch[1].toUpperCase() : 'OPTIONAL', 
                links: linksMatch ? linksMatch[1].split(',').map(l => l.trim()).filter(l => l && l !== 'ID1' && l !== 'ID2') : [],
                reason: reasonMatch ? reasonMatch[1].trim() : 'Validated by Protocol'
              }
            }));
          }
        }
    } catch (error: any) {
      console.error("Error generating document:", error);
      alert(`Error generating document: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveProject = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsProcessing(true);
    try {
      const titleCandidate = chatMessages.find(m => m.role === 'user')?.content || "New BA Session";
      const title = titleCandidate.substring(0, 30) + (titleCandidate.length > 30 ? '...' : '');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, messages: chatMessages, documents })
      });
      if (res.ok) {
        const newProj = await res.json();
        setPastProjects(prev => [newProj, ...prev]);
        setCurrentProjectId(newProj.id);
        alert("Session saved securely to database! Share link is now active.");
      }
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPastProjects(prev => prev.filter(p => p.id !== id));
        if (currentProjectId === id) {
          setCurrentProjectId(null);
          setChatMessages([]);
          setDocuments({});
          setActiveTab("Chat");
          setDocsReady(false);
        }
      } else {
        alert("Failed to delete session.");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const documentTypes = [
    { icon: FileText, label: "BRD" },
    { icon: FileText, label: "FRD" },
    { icon: FileText, label: "PRD" },
    { icon: FileText, label: "SRD" },
    { icon: ShieldAlert, label: "Regulatory Advisor" },
    { icon: Rocket, label: "Executive Pitch" },
    { icon: Play, label: "Test Cases" },
    { icon: Code, label: "UML Diagrams" },
    { icon: GitBranch, label: "Flowcharts" },
    { icon: AlignLeft, label: "Wireframes" },
    { icon: LayoutDashboard, label: "Prototypes" },
  ];

  const downloadDocument = () => {
    const isHtml = activeTab === "Wireframes" || activeTab === "Prototypes";
    const extension = isHtml ? 'html' : 'md';
    const mimeType = isHtml ? 'text/html' : 'text/markdown';
    
    const content = documents[activeTab]?.content || "";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab.replace(/\s+/g, '_')}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const content = documents[activeTab]?.content || "";
    if (!content) return;
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const printDocument = () => {
    if (!documents[activeTab]) {
      alert('No document to export. Please generate a document first.');
      return;
    }

    // For Wireframes and Prototypes, we export the raw HTML source as a PDF summary
    // because iframes cannot be captured by html2canvas due to browser security
    const isVisual = activeTab === 'Wireframes' || activeTab === 'Prototypes';
    const isUML = activeTab === 'UML Diagrams';

    // Build a clean, print-ready HTML document
    const content = documents[activeTab]?.content || '';
    const confidence = documents[activeTab]?.confidence || 0;
    const review = documents[activeTab]?.review || 'UNKNOWN';

    // For UML: extract the rendered SVG img URL so it appears in the PDF
    let umlImgTag = '';
    if (isUML) {
      const imgEl = document.querySelector('#document-content img[alt="UML Diagram"]') as HTMLImageElement;
      if (imgEl?.src) {
        umlImgTag = `<img src="${imgEl.src}" style="max-width:100%;height:auto;border:1px solid #e2e8f0;border-radius:8px;padding:16px;background:white;" />`;
      }
    }

    // Strip markdown code fences for cleaner text
    const cleanText = content
      .replace(/```[\w]*\n?/g, '')
      .replace(/```/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Convert basic markdown to HTML for readable PDF
    const mdToHtml = (text: string) => {
      const lines = text.split('\n');
      let html = '';
      let inTable = false;
      let tableRowIndex = 0;
      let inList = false;

      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Handle Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          if (!inList) { html += '<ul style="margin:8px 0; padding-left:20px;">'; inList = true; }
          html += `<li style="margin:4px 0;">${trimmed.slice(2)}</li>`;
          return;
        } else if (inList && trimmed !== '') {
          // If the line doesn't start with a bullet but we are in a list, it might be a sub-line or end of list
          if (!(trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
            html += '</ul>';
            inList = false;
          }
        } else if (inList && trimmed === '') {
          html += '</ul>';
          inList = false;
        }

        // Handle Tables
        if (trimmed.startsWith('|')) {
          if (!inTable) { html += '<table style="border-collapse:collapse; width:100%; margin:16px 0; border:1px solid #e2e8f0; font-size:9pt;">'; inTable = true; tableRowIndex = 0; }
          if (trimmed.match(/^[\s|:-]+$/)) return; // Skip separator line |---|
          
          const cells = trimmed.replace(/^\||\|$/g, '').split('|');
          html += `<tr style="${tableRowIndex % 2 === 0 ? '' : 'background-color:#f8fafc;'}">`;
          cells.forEach(cell => {
            const content = cell.trim();
            if (tableRowIndex === 0) {
              html += `<th style="border:1px solid #e2e8f0; padding:8px; background-color:#1e40af; color:white; text-align:left; font-weight:bold;">${content}</th>`;
            } else {
              html += `<td style="border:1px solid #e2e8f0; padding:8px; text-align:left; vertical-align:top;">${content}</td>`;
            }
          });
          html += '</tr>';
          tableRowIndex++;
          return;
        } else if (inTable) {
          html += '</table>';
          inTable = false;
        }

        // Handle Headings
        if (line.startsWith('### ')) { html += `<h3 style="color:#2563eb; margin-top:16px;">${line.slice(4)}</h3>`; return; }
        if (line.startsWith('## ')) { html += `<h2 style="color:#1e40af; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-top:20px;">${line.slice(3)}</h2>`; return; }
        if (line.startsWith('# ')) { html += `<h1 style="color:#1e3a5f; border-bottom:2px solid #2563eb; padding-bottom:8px; margin-top:24px;">${line.slice(2)}</h1>`; return; }

        // Handle Empty Lines
        if (trimmed === '') {
          html += '<div style="height:8px;"></div>';
          return;
        }

        // Handle Paragraphs
        html += `<p style="margin:4px 0 8px 0; color:#334155;">${line}</p>`;
      });

      if (inTable) html += '</table>';
      if (inList) html += '</ul>';
      return html;
    };

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${activeTab} — Gaurav Nandhan BA Studio</title>
        <style>
          @page { margin: 20mm; size: A4; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { font-size: 20pt; color: #1e3a5f; margin: 0; }
          .header .meta { font-size: 9pt; color: #64748b; text-align: right; }
          .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 2px 10px; border-radius: 12px; font-size: 8pt; font-weight: bold; margin-right: 5px; }
          .badge-confidence { background: ${confidence >= 90 ? '#d1fae5' : confidence >= 70 ? '#fef3c7' : '#fee2e2'}; color: ${confidence >= 90 ? '#065f46' : confidence >= 70 ? '#92400e' : '#991b1b'}; }
          h1 { font-size: 16pt; color: #1e3a5f; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          h2 { font-size: 13pt; color: #1e40af; margin-top: 16px; }
          h3 { font-size: 11pt; color: #2563eb; margin-top: 12px; }
          p { margin: 4px 0 8px 0; color: #334155; }
          li { margin: 3px 0; color: #334155; }
          ul { padding-left: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9pt; }
          tr:nth-child(even) { background: #f8fafc; }
          td, th { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; vertical-align: top; }
          th { background: #1e40af; color: white; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; }
          .visual-note { background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 10pt; color: #713f12; }
          pre { background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 8pt; overflow-wrap: break-word; white-space: pre-wrap; border: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Gaurav Nandhan BA Studio</h1>
            <p style="margin:4px 0 0 0;color:#64748b;font-size:10pt;">${activeTab} Document</p>
            <span class="badge">BABOK v3 Compliant</span>
            <span class="badge badge-confidence">AI Confidence: ${confidence}% (${review})</span>
          </div>
          <div class="meta">
            Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}<br/>
            ${new Date().toLocaleTimeString('en-IN')}
          </div>
        </div>

        ${isUML && umlImgTag ? `<div style="margin:16px 0;">${umlImgTag}</div><hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />` : ''}

        ${isVisual ? `
          <div class="visual-note">
            ⚠️ This is the structured HTML/Tailwind source for the ${activeTab}. 
            Open the live application to view the interactive rendered preview.
          </div>
          <pre>${cleanText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        ` : mdToHtml(cleanText)}

        <div class="footer">
          <span>Gaurav Nandhan BA Studio — Enterprise Edition</span>
          <span>Confidential &amp; Proprietary</span>
        </div>
      </body>
      </html>
    `;

    // Open in new window and trigger browser print dialog (native, no library needed)
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow pop-ups for this site to export PDF. Check your browser settings.');
      return;
    }
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      // Don't auto-close — let user save as PDF from dialog
    }, 800);
  };

  const exportAllToPDF = () => {
    const docTabs = ['BRD', 'FRD', 'PRD', 'SRD', 'Executive Pitch', 'Test Cases', 'UML Diagrams', 'Flowcharts'];
    const generated = docTabs.filter(tab => documents[tab]?.content && documents[tab].content.trim().length > 50);

    if (generated.length === 0) {
      alert('No documents generated yet. Please generate at least one document from the sidebar first.');
      return;
    }

    const mdToHtml = (text: string) => {
      const lines = text.split('\n');
      let html = '';
      let inTable = false;
      let tableRowIndex = 0;
      let inList = false;

      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Handle Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          if (!inList) { html += '<ul style="margin:8px 0; padding-left:20px;">'; inList = true; }
          html += `<li style="margin:4px 0;">${trimmed.slice(2)}</li>`;
          return;
        } else if (inList && trimmed !== '') {
          if (!(trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
            html += '</ul>';
            inList = false;
          }
        } else if (inList && trimmed === '') {
          html += '</ul>';
          inList = false;
        }

        // Handle Tables
        if (trimmed.startsWith('|')) {
          if (!inTable) { html += '<table style="border-collapse:collapse; width:100%; margin:16px 0; border:1px solid #e2e8f0; font-size:9pt;">'; inTable = true; tableRowIndex = 0; }
          if (trimmed.match(/^[\s|:-]+$/)) return;
          
          const cells = trimmed.replace(/^\||\|$/g, '').split('|');
          html += `<tr style="${tableRowIndex % 2 === 0 ? '' : 'background-color:#f8fafc;'}">`;
          cells.forEach(cell => {
            const content = cell.trim();
            if (tableRowIndex === 0) {
              html += `<th style="border:1px solid #e2e8f0; padding:8px; background-color:#1e40af; color:white; text-align:left; font-weight:bold;">${content}</th>`;
            } else {
              html += `<td style="border:1px solid #e2e8f0; padding:8px; text-align:left; vertical-align:top;">${content}</td>`;
            }
          });
          html += '</tr>';
          tableRowIndex++;
          return;
        } else if (inTable) {
          html += '</table>';
          inTable = false;
        }

        // Handle Headings
        if (line.startsWith('### ')) { html += `<h3 style="color:#2563eb; margin-top:16px;">${line.slice(4)}</h3>`; return; }
        if (line.startsWith('## ')) { html += `<h2 style="color:#1e40af; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-top:20px;">${line.slice(3)}</h2>`; return; }
        if (line.startsWith('# ')) { html += `<h1 style="color:#1e3a5f; border-bottom:2px solid #2563eb; padding-bottom:8px; margin-top:24px;">${line.slice(2)}</h1>`; return; }

        if (trimmed === '') {
          html += '<div style="height:8px;"></div>';
          return;
        }

        html += `<p style="margin:4px 0 8px 0; color:#334155;">${line}</p>`;
      });

      if (inTable) html += '</table>';
      if (inList) html += '</ul>';
      return html;
    };

    // Build UML image tag if UML was generated
    let umlImgTag = '';
    if (documents['UML Diagrams']?.content) {
      const imgEl = document.querySelector('#document-content img[alt="UML Diagram"]') as HTMLImageElement;
      if (imgEl?.src) {
        umlImgTag = `<img src="${imgEl.src}" style="max-width:100%;height:auto;border:1px solid #e2e8f0;border-radius:8px;padding:16px;background:white;" />`;
      }
    }

    const sectionsHtml = generated.map(tab => {
        const docContent = documents[tab]?.content || '';
        const confidence = documents[tab]?.confidence || 0;
        const review = documents[tab]?.review || 'UNKNOWN';
        
        return `
          <div style="page-break-before: always; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h1 style="border:none; margin:0;">${tab}</h1>
              <span class="badge badge-confidence">AI Confidence: ${confidence}% (${review})</span>
            </div>
            ${tab === 'UML Diagrams' && umlImgTag ? `<div style="margin:16px 0;">${umlImgTag}</div>` : ''}
            ${mdToHtml(docContent.replace(/```[\w]*\n?/g, '').replace(/```/g, ''))}
          </div>
        `;
    }).join('\n');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Full BA Report — Gaurav Nandhan BA Studio</title>
        <style>
          @page { margin: 20mm; size: A4; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.6; }
          .cover { text-align: center; padding: 80px 40px; }
          .cover h1 { font-size: 28pt; color: #1e3a5f; }
          .cover h2 { font-size: 16pt; color: #2563eb; font-weight: normal; }
          .cover .date { color: #64748b; margin-top: 20px; }
          .cover .badge { background: #dbeafe; color: #1d4ed8; padding: 6px 20px; border-radius: 20px; font-size: 10pt; font-weight: bold; display: inline-block; margin-top: 16px; }
          .toc { padding: 20px 0; }
          .toc h2 { color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          .toc li { margin: 6px 0; color: #2563eb; font-size: 12pt; }
          h1 { font-size: 14pt; color: #1e3a5f; margin-top: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          h2 { font-size: 12pt; color: #1e40af; margin-top: 14px; }
          h3 { font-size: 11pt; color: #2563eb; margin-top: 10px; }
          p { margin: 4px 0 8px 0; color: #334155; }
          li { margin: 3px 0; color: #334155; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9pt; }
          tr:nth-child(even) { background: #f8fafc; }
          td, th { border: 1px solid #e2e8f0; padding: 5px 8px; text-align: left; }
          th { background: #1e40af; color: white; }
          .footer { margin-top: 30px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>Gaurav Nandhan BA Studio</h1>
          <h2>Full Business Analysis Report</h2>
          <div class="date">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div class="badge">BABOK v3 Compliant · Enterprise Edition</div>
          <p style="color:#64748b;margin-top:30px;">Documents included: ${generated.join(' · ')}</p>
        </div>

        <div class="toc" style="page-break-before: always;">
          <h2>Table of Contents</h2>
          <ol>${generated.map((tab, i) => `<li>${tab}</li>`).join('')}</ol>
        </div>

        ${sectionsHtml}

        <div class="footer" style="page-break-before: avoid;">
          <span>Gaurav Nandhan BA Studio — Enterprise Edition</span>
          <span>Confidential &amp; Proprietary</span>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('Please allow pop-ups for this site to export PDF. Check your browser settings.');
      return;
    }
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  const toggleEdit = () => {
    if (isEditing) {
      setDocuments(prev => ({ 
        ...prev, 
        [activeTab]: { ...prev[activeTab], content: editContent } 
      }));
      setIsEditing(false);
    } else {
      setEditContent(documents[activeTab]?.content || "");
      setIsEditing(true);
    }
  };

  const getShareLink = () => {
    if (!currentProjectId) {
      alert("⚠️ Please 'Save Session' first to generate a shareable link.");
      return;
    }
    const url = `${window.location.origin}/share/${currentProjectId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("✅ Public Share Link Copied! Anyone with this link can now view your work.");
    }).catch(() => {
      alert("Failed to copy link. Please copy the URL from your browser manually.");
    });
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      
      {isProjectSelectionModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400"></div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-blue-400" />
              Select Workspace
            </h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">Please select a project to maintain isolated chat context, or create a new one.</p>
            
            {pastProjects.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Recent Projects</h3>
                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {pastProjects.map(p => (
                    <div key={p.id} className="relative flex items-center group/item">
                      <button onClick={() => {
                        setChatMessages(p.messages || []);
                        const migratedDocs: Record<string, any> = {};
                        Object.entries(p.documents || {}).forEach(([key, val]: [string, any]) => {
                          if (typeof val === 'string') migratedDocs[key] = { content: val, confidence: 100 };
                          else migratedDocs[key] = val;
                        });
                        setDocuments(migratedDocs);
                        setCurrentProjectId(p.id);
                        setIsProjectSelectionModalOpen(false);
                        if (p.messages && p.messages.length > 1) setDocsReady(true);
                        setActiveTab("Chat");
                      }} className="w-full text-left p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all border border-slate-700 hover:border-blue-500/30 group">
                        <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors mb-1 pr-8">{p.title}</div>
                        <div className="text-[10px] text-slate-500 flex justify-between items-center">
                          <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                          <span>{(p.messages?.length || 0)} messages</span>
                        </div>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} 
                        className="absolute right-4 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Start New Project</h3>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newProjectTitle} 
                  onChange={e => setNewProjectTitle(e.target.value)} 
                  onKeyDown={e => {
                     if(e.key === 'Enter') document.getElementById('create-proj-btn')?.click();
                  }}
                  placeholder="e.g. Banking App Redesign" 
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                />
                <button id="create-proj-btn" disabled={isProcessing || !newProjectTitle.trim()} onClick={async () => {
                  if(!newProjectTitle.trim()) return;
                  setIsProcessing(true);
                  try {
                    const res = await fetch('/api/projects', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: newProjectTitle, messages: [], documents: {} })
                    });
                    const newProj = await res.json();
                    setPastProjects(prev => [newProj, ...prev]);
                    setCurrentProjectId(newProj.id);
                    setChatMessages([{ role: "assistant", content: `Hello! I am ready for the new project '${newProjectTitle}'. Please paste your Minutes of Meeting (MOM) to begin.` }]);
                    setIsProjectSelectionModalOpen(false);
                  } catch(e) {
                    console.error(e);
                  } finally {
                    setIsProcessing(false);
                    setNewProjectTitle("");
                  }
                }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className="w-72 bg-[#1e293b]/80 border-r border-slate-700/50 backdrop-blur-xl flex flex-col shadow-2xl z-10 no-print">
        <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">Gaurav Nandhan</h1>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em]">BA Studio</p>
            </div>
            {(session?.user as any)?.orgName && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] text-slate-500 truncate max-w-[140px]">{(session?.user as any)?.orgName}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                  (session?.user as any)?.plan === 'ENTERPRISE' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                  (session?.user as any)?.plan === 'PROFESSIONAL' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                  'text-slate-500 border-slate-600/30 bg-slate-800/50'
                }`}>{(session?.user as any)?.plan || 'STARTER'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Workspace</h2>
              <button 
                onClick={handleNewProject}
                className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors group relative"
                title="Start New Project"
              >
                <Plus className="w-4 h-4" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-[100] border border-slate-700">New Project</span>
              </button>
            </div>
            <nav className="space-y-1">
              <button onClick={() => setActiveTab("Chat")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${activeTab === "Chat" ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                <MessageSquare className="w-4 h-4" />
                BA Agent Chat
              </button>
              <button onClick={() => setShowTimeline(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                <History className="w-4 h-4" />
                Requirement Timeline
                {scopeHistory.length > 1 && (
                  <span className="ml-auto flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}
              </button>
              <button onClick={() => setActiveTab("Traceability Matrix")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${activeTab === "Traceability Matrix" ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                <Network className="w-4 h-4" />
                Traceability Matrix
              </button>
            </nav>
          </div>

          {/* Past Projects / Recent Sessions */}
          {pastProjects.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 px-2 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Recent Sessions
              </h2>
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {pastProjects.map((p, i) => (
                  <div key={p.id} className="relative flex items-center group/item">
                    <button 
                      onClick={() => {
                        setChatMessages(p.messages);
                        // Legacy Support: Convert old string documents to new object format
                        const migratedDocs: Record<string, any> = {};
                        Object.entries(p.documents || {}).forEach(([key, val]: [string, any]) => {
                          if (typeof val === 'string') {
                            migratedDocs[key] = { content: val, confidence: 100, review: 'OPTIONAL', reason: 'Legacy migration' };
                          } else {
                            migratedDocs[key] = val;
                          }
                        });
                        setDocuments(migratedDocs);
                        setCurrentProjectId(p.id);
                        setDocsReady(true);
                        setActiveTab("Chat");
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all border border-transparent ${
                        currentProjectId === p.id 
                          ? 'bg-slate-800 text-blue-400 border-blue-500/20' 
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-medium truncate mb-0.5 pr-6">{p.title}</div>
                      <div className="text-[9px] opacity-50">{new Date(p.updatedAt).toLocaleDateString()}</div>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} 
                      className="absolute right-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Panel link — ADMIN role only */}
          {(session?.user as any)?.role === 'ADMIN' && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 px-2">Administration</h2>
              <nav className="space-y-1">
                <button
                  onClick={() => { const router = document.createElement('a'); router.href = '/admin'; router.click(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium hover:bg-purple-500/10 text-slate-400 hover:text-purple-300 border border-transparent hover:border-purple-500/20"
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  Admin Panel
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">ADMIN</span>
                </button>
              </nav>
            </div>
          )}

          {/* Brain 1: Readiness Meter */}
          {sessionState !== 'INTAKE' && (
            <div className="px-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  SME Readiness
                </h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  sessionState === 'READY' ? 'bg-emerald-500/20 text-emerald-400' :
                  readinessScore >= 3 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {readinessScore}/7
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    sessionState === 'READY' ? 'bg-emerald-400' :
                    readinessScore >= 3 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${(readinessScore / 7) * 100}%` }}
                />
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(readinessChecklist).map(([key, passed]) => (
                  <div key={key} title={key.replace(/([A-Z])/g, ' $1').trim()} className={`w-2 h-2 rounded-full ${passed ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                ))}
              </div>

              {domainDetected && (
                <div className="mb-2 flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Brain className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <span className="text-xs text-blue-300 truncate font-medium">{domainDetected}</span>
                </div>
              )}
              {isAnalyzing && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing...
                </div>
              )}
            </div>
          )}

          <div>
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 px-2">Generated Documents</h2>
            <nav className="space-y-1 relative z-50">
              {documentTypes.map((item, idx) => {
                const isGenerated = !!documents[item.label];
                const isActive = activeTab === item.label;
                return (
                  <button
                    key={idx}
                    onClick={() => handleDocumentClick(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${isGenerated ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-slate-600'}`} />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700/50">
          {session ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center relative font-bold text-white shadow-inner">
                  {session.user?.name?.charAt(0) || "U"}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                </div>
                <div className="text-sm font-medium truncate w-28 text-white" title={session.user?.name || ""}>
                  {session.user?.name || "User"} <br/><span className="text-xs text-green-400 font-normal">Online</span>
                </div>
              </div>
              <button onClick={() => signOut()} className="p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium transition-all shadow-lg shadow-blue-500/20">
              <LogIn className="w-4 h-4" />
              Sign In to Save Work
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e293b] via-[#0f172a] to-[#0f172a] relative">
        <header className="h-16 border-b border-slate-700/30 flex items-center justify-between px-8 bg-[#0f172a]/50 backdrop-blur-md z-10 no-print">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            {activeTab === "Chat" ? <Bot className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
            {activeTab}
          </h2>
          <div className="flex gap-3 items-center">
             <button onClick={saveProject} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 border border-slate-700 transition-colors">
               <Save className="w-4 h-4 text-blue-400" />
               Save Session
             </button>
             
             <button onClick={exportAllToPDF} className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 no-print">
               <Download className="w-3.5 h-3.5" />
               Export All (PDF)
             </button>

             {activeTab !== "Chat" && (
                <div className="flex items-center gap-4">
                  {activeTab === "FRD" && documents[activeTab] && (
                    <button onClick={() => setIsJiraModalOpen(true)} className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:border-slate-500 transition-all flex items-center gap-2 no-print">
                      <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                      Jira Sync
                    </button>
                  )}
                  {activeTab === "Prototypes" && documents[activeTab] && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700 no-print">
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      <select className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer">
                        <option value="en">English (US)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="hi">Hindi (హిन्दी)</option>
                        <option value="ar">Arabic (العربية)</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 px-3 rounded-xl border border-slate-700/50">
                    {(activeTab === "Wireframes" || activeTab === "Prototypes") && documents[activeTab] && (
                      <button onClick={getShareLink} className="p-1.5 px-3 flex items-center gap-2 rounded-md text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-colors">
                        <LinkIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">Share Link</span>
                      </button>
                    )}
                    
                    <button 
                      disabled={!documents[activeTab]} 
                      onClick={toggleEdit} 
                      className={`p-1.5 px-3 flex items-center gap-2 rounded-md transition-colors ${!documents[activeTab] ? 'opacity-40 cursor-not-allowed text-slate-500' : 'hover:bg-slate-700 ' + (isEditing ? 'text-green-400' : 'text-slate-300')}`}
                    >
                      {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      <span className="text-xs font-medium">{isEditing ? "Save" : "Edit"}</span>
                    </button>
                    
                    <div className="w-px h-4 bg-slate-700"></div>
                    
                    <button 
                      disabled={!documents[activeTab]} 
                      onClick={() => setIsJiraModalOpen(true)} 
                      className={`p-1.5 px-3 flex items-center gap-2 rounded-md transition-colors ${!documents[activeTab] ? 'opacity-40 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                    >
                      <Share2 className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium">Jira Sync</span>
                    </button>
                    
                    <button 
                      disabled={!documents[activeTab]} 
                      onClick={copyToClipboard} 
                      className={`p-1.5 px-3 flex items-center gap-2 rounded-md transition-colors ${!documents[activeTab] ? 'opacity-40 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                    >
                      {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span className="text-xs font-medium">Copy</span>
                    </button>
                    
                    <button 
                      disabled={!documents[activeTab]} 
                      onClick={downloadDocument} 
                      className={`p-1.5 px-3 flex items-center gap-2 rounded-md transition-colors ${!documents[activeTab] ? 'opacity-40 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-xs font-medium">Export</span>
                    </button>
                    
                    <button 
                      disabled={!documents[activeTab]} 
                      onClick={printDocument} 
                      className={`p-1.5 px-3 flex items-center gap-2 rounded-md transition-colors ${!documents[activeTab] ? 'opacity-40 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                    >
                      <Printer className="w-4 h-4" />
                      <span className="text-xs font-medium">PDF Export</span>
                    </button>
                  </div>
                </div>
              )}
             <span className="px-4 py-1.5 bg-blue-500/5 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm">
               {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
               {isProcessing ? "Agent Working..." : "Intelligence Online"}
             </span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            {activeTab === "Chat" ? (
              <>
                  <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {chatMessages.map((msg, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} 
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
                          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} 
                          key={idx} 
                          className={`flex gap-6 max-w-4xl ${msg.role === "assistant" ? "" : "ml-auto flex-row-reverse"}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl transition-transform hover:scale-110 ${msg.role === "assistant" ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-blue-500/10" : "bg-slate-800 border border-slate-700 text-slate-200"}`}>
                            {msg.role === "assistant" ? <Brain className="w-6 h-6" /> : <User className="w-6 h-6" />}
                          </div>
                          <div className={`p-6 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap shadow-2xl relative ${msg.role === "assistant" ? "bg-[#1e293b]/90 backdrop-blur-xl border border-slate-700/50 text-slate-200 rounded-tl-sm" : "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-blue-600/20"}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                <div className="p-6 bg-[#1e293b]/50 border-t border-slate-700/50 backdrop-blur-md relative z-10 no-print">
                  <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative flex items-end gap-2 bg-[#0f172a] rounded-xl border border-slate-700/50 p-2 shadow-inner">
                      <input type="file" accept=".txt,.md,.csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                      <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioUpload} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center h-[50px] w-[50px] mb-1"><Paperclip className="w-5 h-5" /></button>
                      <button onClick={() => audioInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center h-[50px] w-[50px] mb-1 group relative"><Mic className="w-5 h-5" /></button>
                      <textarea 
                        value={momInput} 
                        onChange={(e) => setMomInput(e.target.value)} 
                        onInput={(e: any) => setMomInput(e.target.value)}
                        onPaste={(e: any) => {
                          const text = e.clipboardData.getData('text');
                          setMomInput(text);
                        }}
                        placeholder="Paste your MOM or requirements here..." 
                        className="w-full max-h-48 min-h-[56px] bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none resize-none p-3 text-sm" 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                      />
                      <button onClick={handleSend} disabled={!momInput.trim() || isProcessing} className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white transition-colors flex-shrink-0 flex items-center justify-center h-[50px] w-[50px] mb-1 shadow-lg shadow-blue-500/20"><Send className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-8 bg-[#0f172a]/30" id="document-content">
                <div className="max-w-5xl mx-auto bg-[#1e293b]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl min-h-full flex flex-col">
                  {/* Document Toolbar */}
                  <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/40 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                        {activeTab === 'UML Diagrams' ? <GitBranch className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-none mb-1">{activeTab}</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          {scopeHistory.length > 1 ? `Version ${scopeHistory.length}.0 (Revised)` : 'Baseline Version 1.0'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {documents[activeTab] && (
                          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2.5 backdrop-blur-sm transition-all ${
                            !documents[activeTab].confidence ? 'bg-slate-800/50 border-slate-700 text-slate-500' :
                            documents[activeTab].confidence >= 90 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                            documents[activeTab].confidence >= 70 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                            'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-tighter">AI CONFIDENCE</span>
                              <span className="text-xs font-bold">{documents[activeTab].confidence || 0}%</span>
                            </div>
                            <div className="w-px h-3 bg-white/10"></div>
                            <div className="flex items-center gap-1.5">
                              {!documents[activeTab].review ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : documents[activeTab].review === 'REQUIRED' ? (
                                <AlertTriangle className="w-3 h-3 animate-pulse" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span className="text-[9px] font-bold uppercase tracking-tight">
                                {!documents[activeTab].review ? 'Analyzing...' : 
                                 documents[activeTab].review === 'REQUIRED' ? 'Review Required' : 'Verified'}
                              </span>
                            </div>
                            {documents[activeTab].reason && (
                              <div className="group relative">
                                <Info className="w-3 h-3 text-slate-400 cursor-help" />
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-[60]">
                                  {documents[activeTab].reason}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {documents[activeTab] && (
                          <button 
                            onClick={() => handleDocumentClick(activeTab, true)}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold transition-all border border-amber-500/30 shadow-lg shadow-amber-500/5 group"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isProcessing ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                            {scopeHistory.length > 1 ? `Regenerate with v${scopeHistory.length} Updates` : 'Regenerate Document'}
                          </button>
                        )}
                      <button onClick={() => setIsEditing(!isEditing)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-transparent hover:border-slate-700"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={printDocument} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-transparent hover:border-slate-700"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {isProcessing && !documents[activeTab] ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-400">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                      <p>Generating {activeTab}...</p>
                    </div>
                  ) : documents[activeTab] ? (
                    isEditing ? (
                      <div className="p-6 h-[calc(100vh-16rem)] flex flex-col">
                        <div className="flex items-center justify-between mb-4 text-sm text-slate-400 border-b border-slate-700 pb-2">
                          <span>Editing {activeTab} (Markdown supported)</span>
                          <button onClick={() => setIsEditing(false)} className="hover:text-slate-200 flex items-center gap-1"><X className="w-4 h-4"/> Cancel</button>
                        </div>
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 font-mono text-sm focus:outline-none resize-none" />
                      </div>
                    ) : (
                      activeTab === "Wireframes" ? (
                                <div className="p-4 h-full">
                                  {(() => {
                                      const rawContent = documents[activeTab]?.content || "";
                                      // 1. Extract JSON schema
                                      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/i);
                                      let jsonContent = "";
                                      
                                      if (jsonMatch) {
                                        jsonContent = jsonMatch[1].trim();
                                      } else {
                                        // 2. Fallback
                                        const tagStart = rawContent.indexOf('{');
                                        const tagEnd = rawContent.lastIndexOf('}');
                                        if (tagStart !== -1 && tagEnd !== -1 && tagEnd > tagStart) {
                                          jsonContent = rawContent.substring(tagStart, tagEnd + 1).trim();
                                        } else {
                                          jsonContent = rawContent.trim();
                                        }
                                      }

                                      if (!jsonContent || jsonContent.length < 10) {
                                        return (
                                          <div className="p-8 bg-slate-900/80 border border-slate-700 rounded-2xl">
                                            <p className="text-slate-400 text-sm italic mb-4">Rendering system is preparing the UI schema. If it remains blank, please click "Edit" to view raw logic.</p>
                                            <pre className="text-[10px] text-slate-500 font-mono overflow-auto max-h-96">{rawContent}</pre>
                                          </div>
                                        );
                                      }

                                      return <DynamicUIBuilder schema={jsonContent} isProcessing={isProcessing} />;
                                  })()}
                                </div>
                      ) : activeTab === "Prototypes" ? (
                                <div className="p-4 h-full">
                                  {(() => {
                                      const rawContent = documents[activeTab]?.content || "";
                                      let htmlContent = "";
                                      let summary = "";
                                      try {
                                        const parsed = JSON.parse(rawContent);
                                        htmlContent = parsed.code || "";
                                        summary = parsed.summary || "";
                                      } catch (e) {
                                        const htmlMatch = rawContent.match(/```html\s*([\s\S]*?)\s*```/i) || rawContent.match(/```\s*([\s\S]*?)\s*```/i);
                                        if (htmlMatch) {
                                           htmlContent = htmlMatch[1].trim();
                                           summary = rawContent.replace(htmlMatch[0], '').trim();
                                        } else {
                                           htmlContent = rawContent.trim();
                                        }
                                      }
                                      return <LivePreviewIframe htmlContent={htmlContent} isProcessing={isProcessing} summary={summary} />;
                                  })()}
                                </div>
                      ) : (
                        <div className="prose prose-invert prose-slate max-w-none p-10 prose-headings:text-blue-100">
                          {(() => {
                            const content = documents[activeTab]?.content || "";
                            let code = "";
                            let hasUml = false;
                            try {
                              const parsed = JSON.parse(content);
                              code = parsed.code || "";
                              hasUml = code.includes('@startuml');
                            } catch (e) {
                              hasUml = content.includes('@startuml');
                              if (hasUml) {
                                const plantumlMatch = content.match(/@startuml([\s\S]*?)@enduml/);
                                code = plantumlMatch ? plantumlMatch[0].trim() : content;
                              }
                            }

                            if (hasUml) {
                                 // Clean code: Remove themes and other non-standard PlantUML junk
                                 code = code
                                   .replace(/!theme\s+\w+/g, '!theme plain') // Force plain theme for stability
                                   .replace(/\*\*/g, '')
                                   .replace(/\\_/g, '_');
                                 
                                return (
                                  <div className="flex flex-col gap-4">
                                    <PlantUMLRenderer code={code} isProcessing={isProcessing} />
                                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 overflow-hidden">
                                      <div className="flex items-center justify-between mb-2 px-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">PlantUML Source</span>
                                        <button onClick={() => navigator.clipboard.writeText(code)} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
                                          <Copy className="w-3 h-3" /> Copy Code
                                        </button>
                                      </div>
                                      <pre className="text-[11px] text-slate-400 font-mono leading-relaxed overflow-x-auto max-h-60 custom-scrollbar">
                                        {code}
                                      </pre>
                                    </div>
                                  </div>
                                );
                              }
                            const textDocs = ["BRD", "FRD", "PRD", "SRD", "Test Cases", "Executive Pitch", "Regulatory Advisor"];
                            const isTextDoc = textDocs.includes(activeTab);

                            return (
                              <>
                                {isTextDoc && !isProcessing ? (
                                  <CollaborativeEditor 
                                    initialContent={content} 
                                    onUpdate={(newMd) => {
                                      setDocuments(prev => ({
                                        ...prev, 
                                        [activeTab]: { ...prev[activeTab], content: newMd }
                                      }));
                                    }} 
                                  />
                                ) : (
                                  <div className="prose prose-invert prose-slate max-w-none">
                                    <div className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed p-4 border border-slate-700/50 rounded-xl bg-slate-900/50">
                                      {content}
                                      <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle"></span>
                                    </div>
                                  </div>
                                )}
                                {activeTab === "Test Cases" && (
                                  <div className="mt-8 pt-6 border-t border-slate-700/50">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <Play className="w-4 h-4 text-blue-400" /> E2E Automation Suite
                                      </h4>
                                      <button 
                                        onClick={async () => {
                                          setIsGeneratingTests(true);
                                          setPlaywrightScript('');
                                          try {
                                            const res = await fetch('/api/generate/tests', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ 
                                                prototypeCode: documents['Prototypes']?.content || documents['Wireframes']?.content || "No UI code generated yet. Create generic Playwright locators based on standard web practices and the Test Cases provided.", 
                                                testCases: content 
                                              })
                                            });
                                            if (!res.ok) {
                                              const errData = await res.json().catch(() => ({}));
                                              throw new Error(errData.error || `Server error ${res.status}`);
                                            }
                                            // ── DR-RUN Validation layer returns JSON now, not a stream ──
                                            const data = await res.json();
                                            if (data.code) {
                                              setPlaywrightScript(data.code);
                                            } else {
                                              throw new Error("No code returned from validation layer.");
                                            }
                                          } catch (err: any) {
                                            console.error('Playwright generation error:', err);
                                            alert(`Failed to generate Playwright script: ${err.message}`);
                                            setPlaywrightScript(null);
                                          } finally {
                                            setIsGeneratingTests(false);
                                          }
                                        }}
                                        disabled={isGeneratingTests}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                                      >
                                        {isGeneratingTests ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate Playwright Script"}
                                      </button>
                                    </div>
                                    {playwrightScript && (
                                      <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4 relative group">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => navigator.clipboard.writeText(playwrightScript)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-blue-400 border border-slate-700">
                                            <Copy className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <pre className="text-[11px] text-blue-300/80 font-mono leading-relaxed overflow-x-auto max-h-96 custom-scrollbar">
                                          {playwrightScript}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {activeTab === "SRD" && (
                                  <div className="mt-8 pt-6 border-t border-slate-700/50">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <Code className="w-4 h-4 text-blue-400" /> Infrastructure-as-Code (Terraform)
                                      </h4>
                                      <button 
                                        onClick={async () => {
                                          setIsGeneratingIaC(true);
                                          setTerraformPlan('');
                                          try {
                                            const res = await fetch('/api/generate/tests', { 
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ 
                                                prototypeCode: "GENERATE_IAC", 
                                                testCases: content 
                                              })
                                            });
                                            if (!res.ok) {
                                              const errData = await res.json().catch(() => ({}));
                                              throw new Error(errData.error || `Server error ${res.status}`);
                                            }
                                            // ── DR-RUN Validation layer returns JSON now, not a stream ──
                                            const data = await res.json();
                                            if (data.code) {
                                              setTerraformPlan(data.code);
                                            } else {
                                              throw new Error("No code returned from validation layer.");
                                            }
                                          } catch (err: any) {
                                            console.error('IaC generation error:', err);
                                            alert(`Failed to generate IaC Manifest: ${err.message}`);
                                            setTerraformPlan(null);
                                          } finally {
                                            setIsGeneratingIaC(false);
                                          }
                                        }}
                                        disabled={isGeneratingIaC}
                                        className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-blue-500 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                      >
                                        {isGeneratingIaC ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate IaC Manifest"}
                                      </button>
                                    </div>
                                    {terraformPlan && (
                                      <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4 relative group">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => navigator.clipboard.writeText(terraformPlan)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-blue-400 border border-slate-700">
                                            <Copy className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <pre className="text-[11px] text-emerald-400/80 font-mono leading-relaxed overflow-x-auto max-h-96 custom-scrollbar">
                                          {terraformPlan}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )
                    )
                  ) : activeTab === "Traceability Matrix" ? (
                    <div className="p-8 h-full overflow-y-auto">
                      <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Network className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">End-to-End Traceability</h2>
                            <p className="text-slate-400 text-sm">Visualizing cascading requirements, rules, and artifacts</p>
                          </div>
                        </div>

                        {/* Mermaid Traceability Graph */}
                        <div className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl">
                          {(() => {
                            let graphCode = "graph LR\n";
                            graphCode += "classDef req fill:#1e40af,stroke:#3b82f6,color:#fff,stroke-width:2px;\n";
                            graphCode += "classDef doc fill:#1e293b,stroke:#475569,color:#cbd5e1,stroke-width:1px;\n";
                            graphCode += "classDef visual fill:#312e81,stroke:#6366f1,color:#fff,stroke-width:2px;\n";
                            graphCode += "classDef test fill:#064e3b,stroke:#10b981,color:#fff,stroke-width:2px;\n";

                            // Baseline node
                            graphCode += "MOM[Minutes of Meeting]:::req\n";

                            Object.entries(documents).forEach(([name, doc]) => {
                              const nodeId = name.replace(/\s+/g, '_');
                              const cls = (name === 'Wireframes' || name === 'Prototypes') ? 'visual' : 
                                          (name === 'Test Cases') ? 'test' : 'doc';
                              
                              graphCode += `${nodeId}[${name}]:::${cls}\n`;
                              
                              if (doc.links && doc.links.length > 0) {
                                doc.links.forEach(link => {
                                  graphCode += `MOM --> ${nodeId}\n`;
                                });
                              } else {
                                if (['BRD', 'PRD', 'Regulatory Advisor'].includes(name)) {
                                  graphCode += `MOM --> ${nodeId}\n`;
                                }
                              }
                            });

                            if (documents['FRD'] && documents['BRD']) graphCode += "BRD --> FRD\n";
                            if (documents['UML Diagrams'] && documents['FRD']) graphCode += "FRD --> UML_Diagrams\n";
                            if (documents['Wireframes'] && documents['FRD']) graphCode += "FRD --> Wireframes\n";
                            if (documents['Prototypes'] && documents['Wireframes']) graphCode += "Wireframes --> Prototypes\n";
                            if (documents['Test Cases'] && documents['FRD']) graphCode += "FRD --> Test_Cases\n";

                            return <MermaidRenderer chart={graphCode} />;
                          })()}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                             <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Audit Summary</h4>
                             <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                 <span className="text-sm text-slate-400">Total Links Detected</span>
                                 <span className="text-sm font-bold text-blue-400">{Object.values(documents).reduce((acc, d) => acc + (d.links?.length || 0), 0)}</span>
                               </div>
                               <div className="flex justify-between items-center">
                                 <span className="text-sm text-slate-400">Orphaned Artifacts</span>
                                 <span className="text-sm font-bold text-amber-400">{Object.values(documents).filter(d => !d.links || d.links.length === 0).length}</span>
                               </div>
                             </div>
                           </div>
                           <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                             <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">Lifecycle Health</h4>
                             <div className="flex items-center gap-4">
                               <div className="text-3xl font-black text-white">
                                 {Math.round((Object.keys(documents).length / 11) * 100)}%
                               </div>
                               <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tighter">
                                 Coverage of the end-to-end BA lifecycle across all required BABOK v3 dimensions.
                               </p>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-slate-500">Select a document to generate.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Right Sidebar: Intelligence & Insights */}
          <aside className="w-80 border-l border-slate-700/30 bg-[#0f172a]/50 backdrop-blur-md overflow-y-auto no-print flex flex-col">
            <div className="p-4 border-b border-slate-700/30">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                Intelligence Panel
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* ROI & Impact Gauge */}
              {impactScore && (
                <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden relative group">
                   <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Zap className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-400" /> Executive Impact Score
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: "Business Value", val: impactScore.businessValue, color: "bg-green-500" },
                      { label: "Feasibility", val: impactScore.technicalFeasibility, color: "bg-blue-500" },
                      { label: "Alignment", val: impactScore.strategicAlignment, color: "bg-purple-500" }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span className="text-slate-500">{item.label}</span>
                          <span className="text-slate-300">{item.val}/10</span>
                        </div>
                        <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.val * 10}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                            className={`h-full ${item.color} shadow-[0_0_8px_rgba(0,0,0,0.3)]`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Moat Audit */}
              {strategicMoats.length > 0 && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Shield className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Strategic Moat Audit
                  </h4>
                  <div className="space-y-3">
                    {strategicMoats.map((moat, i) => (
                      <div key={i} className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-blue-400" />
                          {moat.type}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic pl-2.5">
                          "{moat.observation}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stakeholder Conflicts */}
              {conflicts.length > 0 && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl relative overflow-hidden group">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Conflict Detector
                  </h4>
                  <div className="space-y-4">
                    {conflicts.map((conflict, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                          {conflict.description}
                        </p>
                        {conflict.resolution && (
                          <div className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-700/30">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Proposed Resolution</div>
                            <p className="text-[10px] text-slate-400 italic leading-snug">
                              {conflict.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regulatory Advisor */}
              {regulatoryFlags.length > 0 && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-400 uppercase">Regulatory</h4>
                  </div>
                  <ul className="space-y-2 mb-3">
                    {regulatoryFlags.map((flag, i) => (
                      <li key={i} className="text-[11px] text-amber-200/70 leading-relaxed flex items-start gap-2">
                        <div className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setMomInput(prev => prev + "\n\nPlease ensure the project follows all identified regulatory standards.")} className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-all font-bold uppercase tracking-tighter text-[9px]">
                    Add to Scope
                  </button>
                </div>
              )}

              {/* Logic Debugger */}
              {logicAlerts.length > 0 && (
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                    <ZapOff className="w-8 h-8 text-orange-400" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-2">
                    <ZapOff className="w-3 h-3" /> Logic Debugger
                  </h4>
                  <div className="space-y-3">
                    {logicAlerts.map((alert, i) => (
                      <div key={i} className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Activity className="w-2.5 h-2.5 text-orange-500" />
                          {alert.type}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed pl-4">
                          {alert.description}
                        </p>
                        <p className="text-[9px] text-orange-500/60 font-bold uppercase tracking-tighter pl-4">
                          Risk: {alert.risk}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirement Gap Analysis */}
              {requirementGaps.length > 0 && (
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                    <FileQuestion className="w-8 h-8 text-purple-400" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2">
                    <FileQuestion className="w-3 h-3" /> Gap Analysis
                  </h4>
                  <div className="space-y-3">
                    {requirementGaps.map((gap, i) => (
                      <div key={i} className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${gap.severity === 'HIGH' ? 'bg-red-500' : 'bg-purple-400'}`} />
                          {gap.area} Gap
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed pl-3 italic">
                          "{gap.gap}"
                        </p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setMomInput(prev => prev + "\n\nPlease address the following gaps:\n" + requirementGaps.map(g => `- ${g.gap}`).join('\n'))} className="mt-4 w-full py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/20 transition-all font-bold uppercase tracking-tighter text-[9px]">
                    Auto-Fill Gap Prompts
                  </button>
                </div>
              )}

              {/* Billion Dollar Disruptions */}
              {billionDollarDisruptions.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3 text-amber-400">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold tracking-tight uppercase text-xs">Billion Dollar Opportunities</h3>
                  </div>
                  <div className="space-y-4">
                    {billionDollarDisruptions.map((disruption, idx) => (
                      <div key={idx} className="group">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{disruption.title}</h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                            disruption.effort === 'low' ? 'bg-green-500/20 text-green-400' :
                            disruption.effort === 'med' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {disruption.effort} effort
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{disruption.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SME Insights */}
              {smeInsight && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-blue-400 uppercase">SME Insight</h4>
                  </div>
                  <p className="text-[11px] text-blue-200/70 leading-relaxed mb-3">{smeInsight}</p>
                  <button onClick={() => setMomInput(prev => prev + `\n\nRegarding the SME insight: ${smeInsight}`)} className="text-[9px] font-bold text-blue-400 uppercase hover:underline">
                    Explore deeper
                  </button>
                </div>
              )}

              {/* Cascading Impact Audit */}
              {staleDocs.size > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl relative overflow-hidden group shadow-lg shadow-red-500/10">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Activity className="w-8 h-8 text-red-500 animate-pulse" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Cascading Impact Alert
                  </h4>
                  <p className="text-[11px] text-red-200/70 mb-3 leading-relaxed">
                    Requirement changes have invalidated the following downstream artifacts. Audit required.
                  </p>
                  <div className="space-y-2 mb-4">
                    {Array.from(staleDocs).map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 bg-red-500/10 rounded border border-red-500/20">
                        <div className="w-1 h-1 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">{doc}</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      const firstStale = Array.from(staleDocs)[0];
                      handleDocumentClick(firstStale, true);
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all shadow-lg shadow-red-600/20"
                  >
                    Regenerate Stale Artifacts
                  </button>
                </div>
              )}

              {/* Impact Analysis */}
              {scopeHistory.length > 1 && scopeHistory[scopeHistory.length - 1].impact && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-emerald-400 uppercase">Impact Analysis</h4>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 leading-relaxed mb-3">
                    {scopeHistory[scopeHistory.length - 1].impact.summary}
                  </p>
                  <button onClick={() => setShowTimeline(true)} className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all font-bold uppercase tracking-tighter text-[9px]">
                    View History
                  </button>
                </div>
              )}

              {/* Knowledge Graph Panel — Semantic Graph Engine */}
              {graphNodes.length > 0 && (
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Network className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                    <Network className="w-3 h-3" /> Knowledge Graph
                  </h4>
                  <div className="space-y-1.5 mb-3">
                    {(['REQUIREMENT','EPIC','FEATURE','SCREEN','API','TEST_CASE'] as const).map(type => {
                      const count = graphNodes.filter(n => n.nodeType === type).length;
                      if (count === 0) return null;
                      const colors: Record<string,string> = {
                        REQUIREMENT: 'bg-blue-500/20 text-blue-400',
                        EPIC:        'bg-purple-500/20 text-purple-400',
                        FEATURE:     'bg-indigo-500/20 text-indigo-400',
                        SCREEN:      'bg-green-500/20 text-green-400',
                        API:         'bg-orange-500/20 text-orange-400',
                        TEST_CASE:   'bg-pink-500/20 text-pink-400',
                      };
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${colors[type]}`}>{type.replace('_',' ')}</span>
                          <span className="text-[10px] font-bold text-slate-300">{count} node{count !== 1 ? 's':''}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[9px] text-slate-600 border-t border-slate-800 pt-2">
                    {graphEdges.length} relationship{graphEdges.length !== 1 ? 's':''} mapped
                  </div>
                  {/* Impacted nodes & paths — shown whenever BFS traversal has run */}
                  {(lastAffectedNodes.length > 0 || lastTraversalPaths.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">

                      {/* Impacted Nodes */}
                      {lastAffectedNodes.length > 0 && (
                        <div>
                          <div className="text-[9px] font-bold text-amber-400 uppercase tracking-tighter mb-1.5 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Impacted by Last Change
                          </div>
                          <div className="space-y-1">
                            {lastAffectedNodes.slice(0, 4).map((node, ni) => {
                              const nodeColors: Record<string,string> = {
                                REQUIREMENT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                EPIC:        'bg-purple-500/20 text-purple-300 border-purple-500/30',
                                FEATURE:     'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                                SCREEN:      'bg-green-500/20 text-green-300 border-green-500/30',
                                API:         'bg-orange-500/20 text-orange-300 border-orange-500/30',
                                TEST_CASE:   'bg-pink-500/20 text-pink-300 border-pink-500/30',
                              };
                              return (
                                <div key={ni} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-mono ${nodeColors[node.nodeType] ?? 'bg-slate-700/40 text-slate-400 border-slate-700'}`}>
                                  <span className="font-bold shrink-0">{node.nodeId}</span>
                                  <span className="truncate opacity-70">{node.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Last Impact Paths — first 3 inline, rest via modal */}
                      {lastTraversalPaths.length > 0 && (
                        <div>
                          <div className="text-[9px] font-bold text-cyan-500 uppercase tracking-tighter mb-1">Last Impact Path</div>
                          {lastTraversalPaths.slice(0, 3).map((p, i) => (
                            <div key={i} className="text-[9px] text-slate-500 font-mono truncate">
                              {p.from} <span className="text-cyan-600">→</span> {p.to}
                            </div>
                          ))}
                          {(lastTraversalPaths.length > 3 || lastAffectedNodes.length > 4) && (
                            <button
                              onClick={() => setShowGraphImpactModal(true)}
                              className="mt-1.5 w-full text-[9px] font-bold text-cyan-400 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg py-1 px-2 transition-all uppercase tracking-tighter cursor-pointer"
                            >
                              {lastTraversalPaths.length > 3 ? `+${lastTraversalPaths.length - 3} more paths` : ''}{lastAffectedNodes.length > 4 ? ` · ${lastAffectedNodes.length - 4} more nodes` : ''} — View Full Impact ↗
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Session Summary Placeholder if empty */}
              {conflicts.length === 0 && regulatoryFlags.length === 0 && !smeInsight && scopeHistory.length <= 1 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center opacity-70">
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                      <p className="text-xs text-blue-400 uppercase font-bold tracking-widest animate-pulse">Analyzing...</p>
                      <p className="text-[10px] text-slate-500 mt-2 px-6">Scanning for conflicts, moats, and risks.</p>
                    </div>
                  ) : chatMessages.length > 1 ? (
                    <div className="flex flex-col items-center opacity-80">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                        <Check className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest text-center">All Systems Nominal</p>
                      <p className="text-[10px] text-slate-500 mt-2 px-6 text-center">No critical conflicts, regulatory gaps, or scope creep detected in current requirements.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-30">
                      <Bot className="w-12 h-12 text-slate-600 mb-4" />
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">No Intelligence Flags</p>
                      <p className="text-[10px] text-slate-600 mt-2 px-6">Input more requirements to activate monitoring.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>


      </main>

      <div id="bulk-print-container" style={{ display: 'none', background: 'white', color: 'black' }}>
        <div style={{ textAlign: 'center', padding: '80px 50px', border: '8px solid #1e293b', margin: '20px', borderRadius: '30px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#1e293b', marginBottom: '10px' }}>Gaurav Nandhan</h1>
          <p style={{ fontSize: '18px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Business Analyst Studio Report</p>
          <div style={{ marginTop: '30px', fontSize: '14px', color: '#94a3b8' }}>Generated on {currentDate}</div>
        </div>

        {Object.entries(documents).map(([name, docObj]) => (
          <div key={name} style={{ pageBreakBefore: 'always', padding: '40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', borderBottom: '3px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ width: '8px', height: '30px', background: '#3b82f6', borderRadius: '4px' }}></span>
              {name}
            </h1>
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({inline, className, children, ...props}: any) { const match = /language-(\w+)/.exec(className || ''); if (!inline && match && match[1] === 'mermaid') { return <MermaidRenderer chart={String(children).replace(/\n$/, '')} /> } if (!inline && (name === "Wireframes" || name === "Prototypes")) { return <div style={{ padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b', fontSize: '11px' }}>Interactive demo code excluded.</div>; } return <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }} {...props}>{children}</code> } }}>
                {(name === "Wireframes" || name === "Prototypes") ? (docObj.content || "").replace(/```html[\s\S]*?```/g, '').trim() : (docObj.content || "")}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <JiraModal isOpen={isJiraModalOpen} onClose={() => setIsJiraModalOpen(false)} docTitle={activeTab} docContent={documents[activeTab]?.content || ""} />

      {/* Scope Evolution Timeline Modal */}
      <AnimatePresence>
        {showTimeline && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTimeline(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-4xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Scope Evolution Timeline</h2>
                    <p className="text-sm text-slate-400">Tracking changes and cascading impact over time</p>
                  </div>
                </div>
                <button onClick={() => setShowTimeline(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-900/30">
                <div className="relative border-l-2 border-slate-700 ml-4 space-y-12 pb-8">
                  {scopeHistory.map((v, i) => (
                    <div key={i} className="relative pl-10">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 shadow-lg ${i === scopeHistory.length - 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                      
                      <div className="flex items-center gap-4 mb-3">
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-slate-300 border border-slate-700 uppercase">Version {i + 1}</span>
                        <span className="text-xs text-slate-500 font-medium">{v.timestamp}</span>
                      </div>

                      {v.impact ? (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-md font-bold text-white flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-400" />
                              Requirement Delta Analysis
                            </h3>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${
                              v.impact.impactScore > 7 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              v.impact.impactScore > 4 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              Impact Score: {v.impact.impactScore}/10
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {/* ADDED */}
                            {v.impact.added?.map((req: any, ci: number) => (
                              <div key={`add-${ci}`} className="flex gap-4 p-3 bg-green-500/5 rounded-xl border border-green-500/20">
                                <Plus className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase bg-green-500/20 text-green-400">ADDED</span>
                                    <span className="text-[10px] font-bold text-slate-500">{req.id}</span>
                                  </div>
                                  <p className="text-sm text-slate-200">{req.text}</p>
                                </div>
                              </div>
                            ))}

                            {/* MODIFIED */}
                            {v.impact.modified?.map((mod: any, ci: number) => (
                              <div key={`mod-${ci}`} className="flex gap-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                                <Zap className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase bg-amber-500/20 text-amber-400">MODIFIED</span>
                                    <span className="text-[10px] font-bold text-slate-500">{mod.updated.id}</span>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-xs text-slate-500 line-through italic">"{mod.old.text}"</p>
                                    <p className="text-sm text-slate-200 font-medium">{mod.updated.text}</p>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* REMOVED */}
                            {v.impact.removed?.map((req: any, ci: number) => (
                              <div key={`rem-${ci}`} className="flex gap-4 p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                                <Trash2 className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase bg-red-500/20 text-red-400">REMOVED</span>
                                    <span className="text-[10px] font-bold text-slate-500">{req.id}</span>
                                  </div>
                                  <p className="text-sm text-slate-400 line-through italic">{req.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {v.impact.architecturalConflict && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <p className="text-xs text-red-300 font-bold">{v.impact.architecturalConflict}</p>
                            </div>
                          )}

                          {/* ── Semantic Graph Traversal Paths ────────────────────────────── */}
                          {i === scopeHistory.length - 1 && lastTraversalPaths.length > 0 && (
                            <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                                <Network className="w-3 h-3" /> Graph Traversal — Downstream Impact
                              </h4>
                              <div className="space-y-1.5">
                                {lastTraversalPaths.map((path, pi) => (
                                  <div key={pi} className="flex items-center gap-1.5 text-[10px] font-mono">
                                    <span className="text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded truncate max-w-[80px]">{path.from}</span>
                                    <span className="text-cyan-600 text-[8px] uppercase tracking-tighter flex-shrink-0">{path.relationship.toLowerCase().replace('_',' ')}</span>
                                    <span className="text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded truncate max-w-[80px]">{path.to}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                          <div className="space-y-3">
                            {v.snapshot?.map((req: any, ci: number) => (
                              <div key={`base-${ci}`} className="flex gap-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                                <div className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0 flex items-center justify-center font-bold text-[10px]">
                                  {ci + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase bg-blue-500/20 text-blue-400">BASELINE</span>
                                    <span className="text-[10px] font-bold text-slate-500">{req.id}</span>
                                  </div>
                                  <p className="text-sm text-slate-200">{req.text}</p>
                                </div>
                              </div>
                            ))}
                            {(!v.snapshot || v.snapshot.length === 0) && (
                              <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5 border-dashed text-center">
                                <p className="text-sm text-slate-500 italic">No baseline requirements identified yet.</p>
                              </div>
                            )}
                          </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
                <button onClick={() => setShowTimeline(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all">Close Timeline</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Graph Impact Full Detail Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showGraphImpactModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowGraphImpactModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700/60 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Full Graph Impact</h2>
                    <p className="text-xs text-slate-400">
                      {lastAffectedNodes.length} node{lastAffectedNodes.length !== 1 ? 's' : ''} impacted &middot; {lastTraversalPaths.length} traversal path{lastTraversalPaths.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowGraphImpactModal(false)} className="p-2 hover:bg-slate-700/60 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                {/* Impacted Nodes — grouped by type */}
                {lastAffectedNodes.length > 0 && (() => {
                  const grouped: Record<string, GraphNodeData[]> = {};
                  for (const n of lastAffectedNodes) {
                    if (!grouped[n.nodeType]) grouped[n.nodeType] = [];
                    grouped[n.nodeType].push(n);
                  }
                  const typeColors: Record<string,{badge:string, row:string}> = {
                    REQUIREMENT: { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   row: 'bg-blue-500/5 border-blue-500/15' },
                    EPIC:        { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', row: 'bg-purple-500/5 border-purple-500/15' },
                    FEATURE:     { badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', row: 'bg-indigo-500/5 border-indigo-500/15' },
                    SCREEN:      { badge: 'bg-green-500/20 text-green-300 border-green-500/30',  row: 'bg-green-500/5 border-green-500/15' },
                    API:         { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', row: 'bg-orange-500/5 border-orange-500/15' },
                    TEST_CASE:   { badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',    row: 'bg-pink-500/5 border-pink-500/15' },
                  };
                  return (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Impacted Nodes ({lastAffectedNodes.length})
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(grouped).map(([type, nodes]) => {
                          const c = typeColors[type] ?? { badge: 'bg-slate-700/40 text-slate-400 border-slate-700', row: 'bg-slate-800/30 border-slate-700/30' };
                          return (
                            <div key={type}>
                              <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter border mb-2 ${c.badge}`}>
                                {type.replace('_', ' ')} &mdash; {nodes.length} node{nodes.length !== 1 ? 's' : ''}
                              </div>
                              <div className="space-y-1">
                                {nodes.map((node, ni) => (
                                  <div key={ni} className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-sm ${c.row}`}>
                                    <span className="font-black text-xs font-mono shrink-0 opacity-80">{node.nodeId}</span>
                                    <span className="text-slate-200 truncate">{node.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* All Traversal Paths */}
                {lastTraversalPaths.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                      <Network className="w-3.5 h-3.5" />
                      All Traversal Paths ({lastTraversalPaths.length})
                    </h3>
                    <div className="space-y-1.5">
                      {lastTraversalPaths.map((path, pi) => (
                        <div key={pi} className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 rounded-xl border border-slate-700/40 font-mono text-xs">
                          <span className="text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded-md shrink-0">{path.from}</span>
                          <span className="text-[10px] text-cyan-500 uppercase tracking-tighter font-sans shrink-0 px-1">{path.relationship.toLowerCase().replace(/_/g,' ')}</span>
                          <span className="text-cyan-300 shrink-0">→</span>
                          <span className="text-slate-200 bg-slate-700/40 px-2 py-0.5 rounded-md truncate">{path.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowGraphImpactModal(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

