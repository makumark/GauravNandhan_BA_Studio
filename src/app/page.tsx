"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import pako from 'pako';
import { AuthModal } from "@/components/AuthModal";
import { JiraModal } from "@/components/JiraModal";


import mermaid from 'mermaid';

// ── Professional Client-side Mermaid Renderer ──────────────────
const MermaidRenderer = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (containerRef.current && chart) {
        setError(null);
        try {
          // 1. Normalize and Clean
          let cleanChart = chart.replace(/```mermaid/g, '').replace(/```/g, '').trim();
          
          // CRITICAL: Fix common AI hallucinations in headers
          if (cleanChart.toLowerCase().startsWith('graph id') || cleanChart.toLowerCase().startsWith('graph name')) {
             cleanChart = cleanChart.replace(/^graph\s+\w+/i, 'graph TD');
          }

          if (!cleanChart.startsWith('graph') && !cleanChart.startsWith('flowchart') && !cleanChart.startsWith('sequenceDiagram')) {
            cleanChart = 'graph TD\n' + cleanChart;
          }

          // 2. Zero-Tolerance Syntax Hardening
          // Convert ALL double quotes to single quotes to prevent any parsing bombs
          cleanChart = cleanChart.replace(/"/g, "'");

          // Sanitize brackets and parentheses aggressively - REMOVE ALL PARENS FROM LABELS
          cleanChart = cleanChart
            .replace(/\[([\s\S]*?)\]/g, (m, label) => `["${label.replace(/[\[\]()"]/g, "").trim()}"]`)
            .replace(/\(([\s\S]*?)\)/g, (m, label) => `("${label.replace(/[\[\]()"]/g, "").trim()}")`)
            .replace(/\{([\s\S]*?)\}/g, (m, label) => `{"${label.replace(/[\[\]{}"]/g, "").trim()}"}`);
          
          // Final Header Guard
          if (cleanChart.toLowerCase().includes('graph id')) {
            cleanChart = cleanChart.replace(/graph\s+id/gi, 'graph TD');
          }
          if (cleanChart.toLowerCase().includes('graph td')) {
            cleanChart = cleanChart.replace(/graph\s+td/gi, 'graph TD');
          }

          // 3. Initialize & Render
          mermaid.initialize({ 
            startOnLoad: false, 
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Inter, system-ui, sans-serif'
          });

          const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, cleanChart);
          
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (e: any) {
          console.error("Mermaid Render Error:", e);
          setError(e.message || "Syntax Error in Diagram");
        }
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4 my-6">
        <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
          <AlertCircle className="w-4 h-4" /> Visual Engine Fallback
        </div>
        <p className="text-[10px] text-slate-500 italic">The AI generated a complex process that the visual engine is struggling to draw. You can view the raw logic below.</p>
        <div className="p-4 bg-slate-900 rounded-xl overflow-x-auto border border-slate-800">
          <pre className="text-[10px] text-slate-400 font-mono">{chart}</pre>
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

export default function Home() {
  const { data: session } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [momInput, setMomInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Chat");
  const [docsReady, setDocsReady] = useState(false);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [pastProjects, setPastProjects] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

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
  const [strategicMoats, setStrategicMoats] = useState<any[]>([]);
  const [impactScore, setImpactScore] = useState<any>(null);

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
        body: JSON.stringify({ message: userMessage, round: newRound }),
      });
      if (!res.ok) return;
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
      
      // Impact Analysis Logic (Option B)
      if (data.snapshot) {
        const prevVersion = scopeHistory.length > 0 ? scopeHistory[scopeHistory.length - 1] : null;
        let impactReport = null;
        
        if (prevVersion) {
          try {
            const impactRes = await fetch('/api/impact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                previousSnapshot: prevVersion.snapshot, 
                currentSnapshot: data.snapshot 
              }),
            });
            if (impactRes.ok) impactReport = await impactRes.json();
          } catch (err) {
            console.error('Impact analysis error', err);
          }
        }
        
        setScopeHistory(prev => [...prev, { 
          snapshot: data.snapshot, 
          impact: impactReport, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
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
        if (Array.isArray(data)) setPastProjects(data);
      });
    }
  }, [session]);

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

  const handleSend = async () => {
    if (!momInput.trim()) return;
    
    const userText = momInput.trim();
    const newMessages = [...chatMessages, { role: "user", content: userText }];
    setChatMessages(newMessages);
    setMomInput("");
    setIsProcessing(true);

    // Brain 1: Run analysis on first message or whenever session is still open
    const isFirstUserMessage = !chatMessages.some(m => m.role === 'user');
    if (isFirstUserMessage || sessionState === 'QUESTIONING') {
      runAnalysis(userText);
    }
    
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

      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined };
        if (done) break;
        assistantContent += decoder.decode(value);
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantContent;
          return updated;
        });
      }
      
      if (newMessages.length >= 1) {
        setDocsReady(true);
      }
    } catch (error: any) {
      console.error("Error communicating with BA Agent:", error);
      setChatMessages(prev => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${error.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentClick = async (docName: string) => {
    if (!docsReady) return;
    
    setActiveTab(docName);
    setIsEditing(false);
    
    // If we already generated it, don't re-fetch
    if (documents[docName]) return;

    setIsProcessing(true);
    let response: any;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages, documentRequested: docName, sessionState, readinessScore, feasibilityIssues })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate document');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let docContent = "";
      
        while (true) {
          const { done, value } = await reader?.read() || { done: true, value: undefined };
          if (done) break;
          docContent += decoder.decode(value);
          
          // Real-time Mermaid/UML Sanitization for the UI
          let sanitizedContent = docContent;
          if (docName === 'Flowcharts') {
            // Aggressive Mermaid Sanitization
            sanitizedContent = sanitizedContent.replace(/([a-zA-Z0-9_-]+)\s*\[([^"\]]+)\]/gi, (m, id, label) => {
              const safeLabel = label.trim().replace(/"/g, "'");
              return `${id}["${safeLabel}"]`;
            });
            // Handle link labels with colons (common AI mistake)
            sanitizedContent = sanitizedContent.replace(/([a-zA-Z0-9_-]+)\s*-->\s*([a-zA-Z0-9_-]+)\s*:\s*([^\n]+)/gi, (m, a, b, l) => {
              const safeLabel = l.trim().replace(/"/g, "'");
              return `${a} -->|${safeLabel}| ${b}`;
            });
            // Handle other node shapes
            sanitizedContent = sanitizedContent.replace(/([a-zA-Z0-9_-]+)\s*\(([^"\]]+)\)/gi, (m, id, label) => {
              const safeLabel = label.trim().replace(/"/g, "'");
              return `${id}("${safeLabel}")`;
            });
            sanitizedContent = sanitizedContent.replace(/([a-zA-Z0-9_-]+)\s*\{([^"\]]+)\}/gi, (m, id, label) => {
              const safeLabel = label.trim().replace(/"/g, "'");
              return `${id}{"${safeLabel}"}`;
            });
            
            if (!sanitizedContent.includes('graph') && !sanitizedContent.includes('flowchart')) {
              sanitizedContent = 'graph TD\n' + sanitizedContent;
            }
          }
          
          setDocuments(prev => ({ ...prev, [docName]: sanitizedContent }));
        }
    } catch (error: any) {
      console.error("Error generating document:", error);
      const rawText = await response?.text().catch(() => '');
      const detail = rawText ? `\n\nDetail: ${rawText.slice(0, 200)}...` : '';
      alert(`Error generating document: ${error.message}${detail}`);
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

  const documentTypes = [
    { icon: FileText, label: "BRD" },
    { icon: FileText, label: "FRD" },
    { icon: FileText, label: "PRD" },
    { icon: FileText, label: "SRD" },
    { icon: Rocket, label: "Executive Pitch" },
    { icon: Play, label: "Test Cases" },
    { icon: Code, label: "UML Diagrams" },
    { icon: GitBranch, label: "Flowcharts" },
    { icon: AlignLeft, label: "Wireframes" },
    { icon: LayoutDashboard, label: "Prototypes" },
  ];

  const downloadDocument = () => {
    if (!documents[activeTab]) return;
    const isHtml = activeTab === "Wireframes" || activeTab === "Prototypes";
    const extension = isHtml ? 'html' : 'md';
    const mimeType = isHtml ? 'text/html' : 'text/markdown';
    
    const blob = new Blob([documents[activeTab]], { type: mimeType });
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
    if (!documents[activeTab]) return;
    navigator.clipboard.writeText(documents[activeTab]);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const printDocument = () => {
    const element = document.getElementById('document-content');
    if (!element) return;
    
    setIsProcessing(true);
    // @ts-ignore
    import('html2pdf.js').then((html2pdf) => {
      // PDF COMPATIBILITY FILTER: html2canvas hates oklch/oklab
      const clone = element.cloneNode(true) as HTMLElement;
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el: any) => {
        const style = window.getComputedStyle(el);
        if (style.color.includes('oklch') || style.color.includes('oklab')) el.style.color = '#334155';
        if (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab')) el.style.backgroundColor = '#f8fafc';
      });

      const opt: any = {
        margin: 10,
        filename: `${activeTab}_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf.default().from(clone).set(opt).save().then(() => {
        setIsProcessing(false);
      });
    });
  };

  const exportAllToPDF = () => {
    const container = document.getElementById('bulk-print-container');
    if (!container) return;

    setIsProcessing(true);
    container.style.display = 'block';
    
    // @ts-ignore
    import('html2pdf.js').then((html2pdf) => {
      // PDF COMPATIBILITY FILTER: html2canvas hates oklch/oklab
      const clone = container.cloneNode(true) as HTMLElement;
      clone.style.display = 'block';
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el: any) => {
        const style = window.getComputedStyle(el);
        if (style.color.includes('oklch') || style.color.includes('oklab')) el.style.color = '#334155';
        if (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab')) el.style.backgroundColor = '#f8fafc';
      });

      const opt: any = {
        margin: 10,
        filename: `Full_BA_Report_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all', before: '.print-page' }
      };
      
      html2pdf.default().from(clone).set(opt).save().then(() => {
        container.style.display = 'none';
        setIsProcessing(false);
      }).catch(err => {
        console.error("PDF Export error", err);
        container.style.display = 'none';
        setIsProcessing(false);
      });
    });
  };

  const toggleEdit = () => {
    if (isEditing) {
      setDocuments(prev => ({ ...prev, [activeTab]: editContent }));
      setIsEditing(false);
    } else {
      setEditContent(documents[activeTab] || "");
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
      
      <aside className="w-72 bg-[#1e293b]/80 border-r border-slate-700/50 backdrop-blur-xl flex flex-col shadow-2xl z-10 no-print">
        <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">Gaurav Nandhan</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em]">Sovereign BA Studio</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 px-2">Workspace</h2>
            <nav className="space-y-1">
              <button onClick={() => setActiveTab("Chat")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${activeTab === "Chat" ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                <MessageSquare className="w-4 h-4" />
                BA Agent Chat
              </button>
            </nav>
          </div>

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
              {activeTab !== "Chat" && documents[activeTab] && (
                <div className="flex items-center gap-4">
                  <button onClick={exportAllToPDF} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 no-print">
                    <Download className="w-3.5 h-3.5" />
                    Export All (PDF)
                  </button>
                  <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 px-3 rounded-xl border border-slate-700/50">
                  {(activeTab === "Wireframes" || activeTab === "Prototypes") && (
                    <button onClick={getShareLink} className="p-1.5 px-3 flex items-center gap-2 rounded-md text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-colors">
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">Share Link</span>
                    </button>
                  )}
                  <button onClick={toggleEdit} className={`p-1.5 px-3 flex items-center gap-2 rounded-md hover:bg-slate-700 transition-colors ${isEditing ? 'text-green-400' : 'text-slate-300'}`}>
                    {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    <span className="text-xs font-medium">{isEditing ? "Save" : "Edit"}</span>
                  </button>
                  <div className="w-px h-4 bg-slate-700"></div>
                  <button onClick={() => setIsJiraModalOpen(true)} className="p-1.5 px-3 flex items-center gap-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium">Jira Sync</span>
                  </button>
                  <button onClick={copyToClipboard} className="p-1.5 px-3 flex items-center gap-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-medium">Copy</span>
                  </button>
                  <button onClick={downloadDocument} className="p-1.5 px-3 flex items-center gap-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-xs font-medium">Export</span>
                  </button>
                  <button onClick={printDocument} className="p-1.5 px-3 flex items-center gap-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
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
                <div className="max-w-5xl mx-auto bg-[#1e293b]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl min-h-full">
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
                      (activeTab === "Wireframes" || activeTab === "Prototypes") ? (
                        <div className="p-4 h-full">
                          {(() => {
                              const rawContent = documents[activeTab];
                              const htmlMatch = rawContent.match(/```html\s+([\s\S]*?)(\s+```|$)/i);
                              let htmlContent = htmlMatch ? htmlMatch[1].trim() : rawContent.replace(/```html/gi, '').replace(/```/g, '').trim();
                              const summary = rawContent.replace(/```html[\s\S]*?```/g, '').trim();
                              const fullHtml = htmlContent.includes('<html') ? htmlContent : `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script><style>body { background: transparent; color: white; font-family: sans-serif; }</style></head><body>${htmlContent}</body></html>`;
                              return (
                                <div className="flex flex-col gap-6">
                                  <div className="prose prose-invert prose-slate max-w-none p-6 bg-slate-800/40 rounded-xl border border-slate-700/50">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                                  </div>
                                  <div className="my-2 border border-slate-700 rounded-xl overflow-hidden bg-[#0f172a] shadow-2xl h-[calc(100vh-32rem)] min-h-[600px] relative">
                                    <iframe 
                                      srcDoc={fullHtml} 
                                      className="w-full h-full border-none" 
                                      title="Prototype Preview" 
                                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
                                      onLoad={(e) => {
                                        const win = (e.target as HTMLIFrameElement).contentWindow;
                                        if (win) {
                                          // Force focus on click to ensure keyboard events work
                                          win.document.body.onclick = () => win.focus();
                                          win.addEventListener('click', (ev: any) => {
                                            const link = ev.target.closest('a');
                                            if (link && (link.getAttribute('href') === '#' || link.getAttribute('href')?.startsWith('/'))) {
                                              ev.preventDefault();
                                            }
                                          });
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                          })()}
                        </div>
                      ) : (
                        <div className="prose prose-invert prose-slate max-w-none p-10 prose-headings:text-blue-100">
                          {(() => {
                            const content = documents[activeTab];
                            if (content.includes('@startuml')) {
                              const plantumlMatch = content.match(/@startuml([\s\S]*?)@enduml/);
                              if (plantumlMatch) {
                                const rawCode = plantumlMatch[0].trim();
                                const code = rawCode.split('\n')
                                  .map(line => line.split("'")[0].replace(/\*\*/g, '').trim())
                                  .filter(line => line.length > 0)
                                  .join('\n');
                                const data = new TextEncoder().encode(code);
                                const compressed = pako.deflate(data, { level: 9 });
                                const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)))
                                  .replace(/\+/g, '-')
                                  .replace(/\//g, '_');
                                
                                return (
                                  <div className="flex flex-col gap-4">
                                    <div className="bg-white p-8 rounded-2xl border border-slate-700/50 shadow-xl flex justify-center group relative overflow-hidden">
                                      <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
                                      <img src={`https://kroki.io/plantuml/svg/${base64}`} alt="UML Diagram" className="max-w-full h-auto relative z-10" />
                                    </div>
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
                            }
                            return (
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]} 
                                components={{ 
                                  code({inline, className, children, ...props}: any) { 
                                    const match = /language-(\w+)/.exec(className || ''); 
                                    if (!inline && match && match[1] === 'mermaid') { 
                                      const chartCode = String(children).replace(/\n$/, '');
                                      // If it's too short or doesn't have a basic graph structure yet, show loader
                                      if (chartCode.length < 10 || (!chartCode.includes('graph') && !chartCode.includes('flowchart'))) {
                                        return <div className="p-4 bg-slate-900/50 rounded flex items-center gap-2 text-slate-500 text-xs italic"><Loader2 className="w-3 h-3 animate-spin" /> Rendering diagram...</div>;
                                      }
                                      return <MermaidRenderer chart={chartCode} /> 
                                    } 
                                    return <code className={className} {...props}>{children}</code> 
                                  } 
                                }}
                              >
                                {content}
                              </ReactMarkdown>
                            );
                          })()}
                        </div>
                      )
                    )
                  ) : (
                    <div className="flex items-center justify-center h-96 text-slate-500">Select a document to generate.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Right Sidebar: Intelligence & Insights */}
          <aside className="w-80 border-l border-slate-700/30 bg-[#0f172a]/50 backdrop-blur-md overflow-y-auto no-print hidden xl:flex flex-col">
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

              {/* Session Summary Placeholder if empty */}
              {conflicts.length === 0 && regulatoryFlags.length === 0 && !smeInsight && scopeHistory.length <= 1 && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                  <Bot className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Awaiting Analysis</p>
                  <p className="text-[10px] text-slate-600 mt-2 px-6">Input requirements to activate intelligence monitoring.</p>
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
          <div style={{ marginTop: '30px', fontSize: '14px', color: '#94a3b8' }}>Generated on {new Date().toLocaleDateString()}</div>
        </div>

        {Object.entries(documents).map(([name, content]) => (
          <div key={name} style={{ pageBreakBefore: 'always', padding: '40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', borderBottom: '3px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ width: '8px', height: '30px', background: '#3b82f6', borderRadius: '4px' }}></span>
              {name}
            </h1>
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({inline, className, children, ...props}: any) { const match = /language-(\w+)/.exec(className || ''); if (!inline && match && match[1] === 'mermaid') { return <MermaidRenderer chart={String(children).replace(/\n$/, '')} /> } if (!inline && (name === "Wireframes" || name === "Prototypes")) { return <div style={{ padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b', fontSize: '11px' }}>Interactive demo code excluded.</div>; } return <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }} {...props}>{children}</code> } }}>
                {(name === "Wireframes" || name === "Prototypes") ? content.replace(/```html[\s\S]*?```/g, '').trim() : content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <JiraModal isOpen={isJiraModalOpen} onClose={() => setIsJiraModalOpen(false)} docTitle={activeTab} docContent={documents[activeTab] || ""} />

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
                          <h3 className="text-md font-bold text-emerald-400 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {v.impact.summary}
                          </h3>
                          
                          <div className="space-y-4">
                            {v.impact.changes.map((change: any, ci: number) => (
                              <div key={ci} className="flex gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${change.type === 'ADDED' ? 'bg-green-500' : change.type === 'REMOVED' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-300">{change.id}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase ${change.type === 'ADDED' ? 'bg-green-500/10 text-green-400' : change.type === 'REMOVED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{change.type}</span>
                                  </div>
                                  <p className="text-sm text-slate-200 mb-2">{change.text}</p>
                                  {change.impact && (
                                    <div className="pl-3 border-l-2 border-emerald-500/30">
                                      <p className="text-xs text-emerald-300/70 italic">Impact: {change.impact}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {v.impact.architecturalConflict && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <p className="text-xs text-red-300"><span className="font-bold">Architectural Conflict:</span> {v.impact.architecturalConflict}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5 border-dashed">
                          <p className="text-sm text-slate-500 italic">Initial baseline requirements captured.</p>
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
    </div>
  );
}

