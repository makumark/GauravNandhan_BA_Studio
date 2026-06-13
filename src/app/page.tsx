"use client";

import { DynamicUIBuilder } from '@/components/DynamicUIBuilder';
import { LogicSandboxRenderer } from '@/components/LogicSandbox';
import { DiagramErrorBoundary } from '@/components/DiagramErrorBoundary';

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
  Cpu, 
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


import { ReactFlowCanvas } from '@/components/features/editors/ReactFlowCanvas';
import { MermaidCanvas } from '@/components/features/editors/MermaidCanvas';
import { LivePreviewIframe } from '@/components/features/editors/LivePreviewIframe';
import { ConflictResolveModal } from '@/components/ConflictResolveModal';
import { ScopeCreepWidget } from '@/components/ScopeCreepWidget';
import { TraceabilityCanvas } from '@/components/TraceabilityCanvas';


export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
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
  
  // Custom PM Handoff state
  const [isSubmittingToPM, setIsSubmittingToPM] = useState(false);
  const [cachedTemplates, setCachedTemplates] = useState<any[]>([]);

  // â”€â”€ Brain 1: Session State Machine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const [activeConflict, setActiveConflict] = useState<any | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [resolvedConflictIds, setResolvedConflictIds] = useState<Set<string>>(new Set());
  const [scopeHistory, setScopeHistory] = useState<{snapshot: any[], impact?: any, timestamp: string}[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [isPmModalOpen, setIsPmModalOpen] = useState(false);
  const [pmList, setPmList] = useState<any[]>([]);
  const [selectedPmId, setSelectedPmId] = useState<string>("");
  const [isLoadingPms, setIsLoadingPms] = useState(false);

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

  // â”€â”€ Semantic Graph State (in-memory, zero cost) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Stores the current session's graph nodes and edges as plain JS objects.
  // buildInMemoryGraph() converts these into an adjacency map for BFS traversal.
  // Works for ALL users (logged in or not) â€” no DB required for traversal.
  const [graphNodes, setGraphNodes] = useState<GraphNodeData[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdgeData[]>([]);
  // Latest traversal result â€” populated after each requirement change
  const [lastTraversalPaths, setLastTraversalPaths] = useState<{from:string;to:string;relationship:string}[]>([]);
  const [lastAffectedNodes, setLastAffectedNodes] = useState<GraphNodeData[]>([]);
  const [showGraphImpactModal, setShowGraphImpactModal] = useState(false);

  // â”€â”€ Human Brain Agent: Product Health State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [healthCheckResult, setHealthCheckResult] = useState<any>(null);
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const loadDemoData = () => {
    // 1. Populate conflicts
    setConflicts([
      { id: 'REQ-C-001', severity: 'HIGH', description: 'Sprint 1 logic specifies static username/password login, but Sprint 3 introduces MFA requirements. Additive merge required.', resolution: 'Layer MFA on top of static login flow.' }
    ]);
    
    // 2. Populate scope history
    setScopeHistory([
      { snapshot: Array(5).fill('req'), timestamp: '2026-06-01' },
      { snapshot: Array(7).fill('req'), timestamp: '2026-06-02' },
      { snapshot: Array(15).fill('req'), timestamp: '2026-06-04' } // Significant scope drift
    ]);

    // 3. Populate Traceability Graph and Stale Docs
    setGraphNodes([
      { id: 'BRD', label: 'Business Requirements Document', type: 'doc', text: 'Baseline requirements for the FinTech platform...' },
      { id: 'FRD', label: 'Functional Requirements Document', type: 'doc', text: '1. User can login via MFA.\n2. User can view dashboard...' },
      { id: 'Wireframes', label: 'Wireframes', type: 'doc', text: 'UI specifications for the MFA login screen...' },
      { id: 'Test_Cases', label: 'Test Cases', type: 'doc', text: 'Test MFA token validation logic...' }
    ]);
    setGraphEdges([
      { source: 'BRD', target: 'FRD', type: 'derives' },
      { source: 'FRD', target: 'Wireframes', type: 'derives' },
      { source: 'FRD', target: 'Test_Cases', type: 'validates' }
    ]);
    
    setDocuments({
      'BRD': { content: 'Baseline requirements...' },
      'FRD': { content: '1. User can login via MFA...' },
      'Wireframes': { content: 'UI specifications...' },
      'Test Cases': { content: 'Test logic...' }
    });

    setStaleDocs(new Set(['Wireframes', 'Test_Cases']));
  };

  const runHealthCheck = async () => {
    setIsRunningHealthCheck(true);
    setShowHealthCheck(true);
    try {
      const res = await fetch('/api/healthcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages, documents, domainDetected })
      });
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      const data = await res.json();
      setHealthCheckResult(data);
    } catch (e: any) {
      console.error('Health check error:', e);
      setHealthCheckResult({ error: e.message });
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

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

  // â”€â”€ Brain 1: Feasibility & Completeness Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const runAnalysis = async (userMessage: string, historyOverride?: {role: string, content: string}[]) => {
    setIsAnalyzing(true);
    const newRound = questionRoundCount + 1;
    setQuestionRoundCount(newRound);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          history: historyOverride || chatMessages, // Send full history for version tracking
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

        // â”€â”€ SEMANTIC GRAPH: Update in-memory graph from latest analysis response â”€â”€â”€â”€â”€â”€â”€â”€
        const newNodes: GraphNodeData[] = data.graphNodes || [];
        const newEdges: GraphEdgeData[] = data.graphEdges || [];
        setGraphNodes(newNodes);
        setGraphEdges(newEdges);

        // â”€â”€ SEMANTIC GRAPH: Precise stale-doc detection via BFS traversal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // Run BFS whenever ANY requirement changed (added, modified, or removed)
        if (
          impactReport &&
          ((impactReport.added?.length ?? 0) > 0 ||
           (impactReport.modified?.length ?? 0) > 0 ||
           (impactReport.removed?.length ?? 0) > 0)
        ) {
          const ir = impactReport; // narrowed local â€” not null from here
          const changedIds = [
            ...(ir.added?.map((a: any) => a.id) ?? []),
            ...(ir.modified?.map((m: any) => m.updated.id) ?? []),
            ...(ir.removed?.map((r: any) => r.id) ?? []),
          ];

          if (newNodes.length > 0 && changedIds.length > 0) {
            // Build adjacency map and run BFS â€” pure JS, zero cost
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
            // Legacy fallback: no graph data yet â€” use old link-based detection
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
    } catch (e: any) {
      console.error('Brain 1 analysis error', e);
      setSessionState("QUESTIONING");
      setDomainDetected("Complex Application");
      setSmeInsight("The requirement volume was too extreme for the AI to parse in 60 seconds (Server Timeout). Please break down requirements or refresh.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isProcessing]);

  // ── Session Persistence: Save to localStorage on every meaningful change ──
  useEffect(() => {
    // Only persist if the user has started a conversation and is NOT on a saved DB project
    // (DB projects are already persisted — no need to double-save)
    if (currentProjectId) return; // DB project — skip localStorage
    if (chatMessages.length <= 1) return; // Only the welcome message — nothing to save
    try {
      const snapshot = {
        chatMessages,
        docsReady,
        domainDetected,
        readinessScore,
        sessionState,
        // Documents: cap each doc content to 50KB to stay within localStorage limits
        documents: Object.fromEntries(
          Object.entries(documents).map(([k, v]) => [k, { ...v, content: (v.content || '').substring(0, 50000) }])
        )
      };
      localStorage.setItem('ba_studio_session', JSON.stringify(snapshot));
    } catch (e) {
      // localStorage full or unavailable — fail silently
      console.warn('localStorage save failed', e);
    }
  }, [chatMessages, documents, docsReady, currentProjectId]);

  // ── Session Recovery: Restore from localStorage on first load ──
  useEffect(() => {
    if (currentProjectId) return; // Already loading from DB
    try {
      const saved = localStorage.getItem('ba_studio_session');
      if (!saved) return;
      const snapshot = JSON.parse(saved);
      // Only restore if there is meaningful saved data (more than the welcome message)
      if (snapshot.chatMessages && snapshot.chatMessages.length > 1) {
        const shouldRestore = window.confirm(
          '🗂️ You have an unsaved session from your last visit. Would you like to restore it?\n\nClick OK to restore, or Cancel to start fresh.'
        );
        if (shouldRestore) {
          setChatMessages(snapshot.chatMessages);
          setDocuments(snapshot.documents || {});
          setDocsReady(snapshot.docsReady ?? false);
          setDomainDetected(snapshot.domainDetected || '');
          setReadinessScore(snapshot.readinessScore || 0);
          setSessionState(snapshot.sessionState || 'INTAKE');
        } else {
          localStorage.removeItem('ba_studio_session');
        }
      }
    } catch (e) {
      console.warn('Session restore failed', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (session?.user) {
      fetch('/api/projects').then(res => res.json()).then(data => {
        if (Array.isArray(data)) {
          setPastProjects(data);
          if (!currentProjectId && data.length > 0) {
            setIsProjectSelectionModalOpen(true);
          }
        }
      });
    }
  }, [session, currentProjectId]);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/templates')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCachedTemplates(data); })
      .catch(() => {});
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
        try {
          const base64Data = (event.target?.result as string).split(',')[1];
          
          const newMessages = [...chatMessages, { role: "user", content: `Analyzing audio file: ${file.name}` }];
          setChatMessages(newMessages);

          const response = await fetch('/api/audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              audioData: base64Data,
              mimeType: file.type
            })
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to transcribe audio');

          // Insert the transcribed text into the chat input for the user to review before sending
          setMomInput(prev => prev + (prev ? '\n\n' : '') + `[Audio Transcript from ${file.name}]:\n${data.content}`);
          setChatMessages(prev => prev.filter(m => m.content !== `Analyzing audio file: ${file.name}`));
          alert(`✅ Audio transcribed successfully! The transcript has been added to your input box. Review it and click Send.`);
        } catch (error: any) {
          console.error("Audio processing error:", error);
          alert(`Error processing audio: ${error.message}`);
          setChatMessages(prev => prev.filter(m => m.content !== `Analyzing audio file: ${file.name}`));
        } finally {
          setIsProcessing(false);
          if (audioInputRef.current) audioInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Audio reader error:", error);
      alert(`Error reading audio file: ${error.message}`);
      setIsProcessing(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleNewProject = () => {
    if (chatMessages.length > 1 && !currentProjectId) {
      if (!confirm("âš ï¸ You have unsaved work. Starting a new project will clear current progress. Continue?")) return;
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
    localStorage.removeItem('ba_studio_session');
    // Reset semantic graph state
    setGraphNodes([]);
    setGraphEdges([]);
    setLastTraversalPaths([]);
    setLastAffectedNodes([]);
  };

  const handleSend = async () => {
    if (!momInput.trim()) return;
    
    // Input size guard — prevent token limit crashes
    if (momInput.trim().length > 50000) {
      alert('⚠️ Input is too large (over 50,000 characters). Please break your requirements into smaller sections and send them in multiple messages.');
      return;
    }
    if (momInput.trim().length > 15000) {
      const proceed = window.confirm('⚠️ Large input detected (' + Math.round(momInput.trim().length / 1000) + 'K characters). This may slow down the AI response. Continue?');
      if (!proceed) return;
    }
    
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
        // Auto-regenerate the active document when user sends a new requirement message.
        // This ensures the user instantly sees the effect of their new requirement.
        if (activeTab) {
          const finalMessages = [...newMessages, { role: "assistant", content: assistantContent }];
          setTimeout(() => {
            handleDocumentClick(activeTab, true, finalMessages);
          }, 100);
        }
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

  const handleOpenPmModal = async () => {
    if (!currentProjectId) {
      alert("Please save the project first before submitting to PM!");
      return;
    }
    setIsPmModalOpen(true);
    setIsLoadingPms(true);
    try {
      const res = await fetch('/api/organization/pms');
      if (res.ok) {
        const data = await res.json();
        setPmList(data);
        if (data.length > 0) setSelectedPmId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch PMs", e);
    } finally {
      setIsLoadingPms(false);
    }
  };

  const handlePMSubmit = async () => {
    setIsSubmittingToPM(true);
    try {
      const res = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId, pmId: selectedPmId || undefined })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate PM tasks");
      }
      router.push('/board');
    } catch (err: any) {
      alert(`Error handing off to PM: ${err.message}`);
    } finally {
      setIsSubmittingToPM(false);
      setIsPmModalOpen(false);
    }
  };

  const handleDocumentClick = async (docName: string, force = false, messagesOverride?: any[]) => {
    if (!docsReady) return;


    setActiveTab(docName);
    setIsEditing(false);
    
    // If we already generated it and not forcing AND not stale, don't re-fetch
    // UNLESS it's an error state (failed generation), then allow retry.
    if (documents[docName] && !force && !staleDocs.has(docName)) {
      const content = documents[docName].content || "";
      if (!content.includes('[Generation Error:') && !content.includes('Generation Failed')) {
        return;
      }
    }

    // Clear stale flag if we are about to regenerate
    if (staleDocs.has(docName)) {
      setStaleDocs(prev => {
        const next = new Set(prev);
        next.delete(docName);
        return next;
      });
    }

    setIsProcessing(true);
    // Initialize the document with "Analyzing..." so the UI shows the spinner
    setDocuments(prev => ({
      ...prev,
      [docName]: { ...prev[docName], content: "", confidence: 0, review: undefined }
    }));

    const functionalContext = documents['FRD']?.content || documents['PRD']?.content || documents['BRD']?.content || "";
    const designContext = docName === 'Prototypes' ? documents['Wireframes']?.content : "";
    const combinedContext = `${functionalContext}\n\n${designContext}`.trim();

    try {
      let generatedContent = '';

      let activeProjectId = currentProjectId;
      if (docName === 'Prototypes' || docName === 'Wireframes' || docName === 'UML Diagrams' || docName === 'Logic Sandbox') {
        if (!activeProjectId) {
          activeProjectId = await saveProject();
          if (!activeProjectId) {
             throw new Error("You must be logged in and save the project to generate visual artifacts.");
          }
        }
      }

      // Use cached templates (loaded once on login) — no per-click DB call
      const matched = cachedTemplates.find((t: any) => t.name.toLowerCase() === docName.toLowerCase());
      const templateContent = matched?.content || "";

      const isVisualArtifact = ['UML Diagrams', 'Wireframes', 'Prototypes', 'Flowcharts'].includes(docName);

      if (isVisualArtifact && activeProjectId) {
        // Use RAG Endpoint to bypass 429 limits
        const res = await fetch('/api/generate-artifact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: activeProjectId, artifactType: docName })
        });
        
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "RAG Generation failed");
        }
        generatedContent = data.content;
        
        setDocuments(prev => ({
          ...prev,
          [docName]: { ...prev[docName], content: generatedContent }
        }));
      } else {
        const streamRes = await fetch('/api/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesOverride || chatMessages,
            documentRequested: docName,
            domainDetected,
            functionalContext: combinedContext,
            existingDocument: documents[docName]?.content || "",
            templateContent
          })
        });

        if (!streamRes.ok) {
          const errData = await streamRes.json().catch(() => ({}));
          throw new Error(errData.error || `Generation failed (HTTP ${streamRes.status})`);
        }

        const reader = streamRes.body?.getReader();
        const decoder = new TextDecoder();
        let lastRender = 0;

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          generatedContent += decoder.decode(value);
          const now = Date.now();
          if (now - lastRender > 80) {
            lastRender = now;
            const snap = generatedContent;
            setDocuments(prev => ({
              ...prev,
              [docName]: { ...prev[docName], content: snap }
            }));
          }
        }
        // Final flush
        setDocuments(prev => ({
          ...prev,
          [docName]: { ...prev[docName], content: generatedContent }
        }));

        // Catch Google Generative AI streaming quota errors gracefully!
        if (generatedContent.includes('[Generation Error:')) {
          const match = generatedContent.match(/\[Generation Error: (.*?)\]/);
          throw new Error(match ? match[1] : "API Quota Exceeded (429). Please wait a minute and try again.");
        }
      }

      // Stream completed! Now silently save to database
      if (activeProjectId) {
        fetch('/api/documents/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: activeProjectId,
            documentType: docName,
            content: generatedContent
          })
        }).catch(err => console.error("Failed to save document:", err));
      }

        // Final Meta-Parsing: Extract from [CONFIDENCE: XX% | REVIEW: ... | LINKS: ... | REASON: ...]
        const metaMatch = generatedContent.match(/\[CONFIDENCE:\s*(\d+)%\s*\|\s*REVIEW:\s*(REQUIRED|OPTIONAL)\s*\|\s*LINKS:\s*([\s\S]*?)\s*\|\s*REASON:\s*([\s\S]*?)\]/i);

        if (metaMatch) {
          const confidence = parseInt(metaMatch[1]);
          const review = metaMatch[2].toUpperCase();
          const links = metaMatch[3].split(',').map((l: string) => l.trim()).filter((l: string) => l && l !== 'ID1' && l !== 'ID2');
          const reason = metaMatch[4].trim();
          
          const cleanContent = generatedContent.replace(/\[CONFIDENCE:[\s\S]*?\]/gi, '').trim();

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
          const confMatch = generatedContent.match(/CONFIDENCE:\s*(\d+)%/i);
          const reviewMatch = generatedContent.match(/REVIEW:\s*(REQUIRED|OPTIONAL)/i);
          const linksMatch = generatedContent.match(/LINKS:\s*([^\]|]*)/i);
          const reasonMatch = generatedContent.match(/REASON:\s*([^\]|]*)/i);

          setDocuments(prev => ({
            ...prev,
            [docName]: { 
              ...prev[docName],
              content: generatedContent,
              confidence: confMatch ? parseInt(confMatch[1]) : 100, 
              review: reviewMatch ? reviewMatch[1].toUpperCase() : 'OPTIONAL', 
              links: linksMatch ? linksMatch[1].split(',').map((l: string) => l.trim()).filter((l: string) => l && l !== 'ID1' && l !== 'ID2') : [],
              reason: reasonMatch ? reasonMatch[1].trim() : 'Validated by Protocol'
            }
          }));
        }

        // Cascading staleness: when a core document is regenerated, mark its children/dependencies as stale
        if (['BRD', 'FRD', 'PRD', 'SRD'].includes(docName)) {
          setStaleDocs(prev => {
            const next = new Set(prev);
            if (docName === 'FRD' || docName === 'PRD') {
              next.add('Wireframes');
              next.add('Prototypes');
              next.add('Flowcharts');
              next.add('Logic Sandbox');
              next.add('UML Diagrams');
              next.add('Test Cases');
            }
            if (docName === 'BRD') {
              next.add('Executive Pitch');
              next.add('Regulatory Advisor');
            }
            return next;
          });
        }
        if (docName === 'Wireframes') {
          setStaleDocs(prev => {
            const next = new Set(prev);
            next.add('Prototypes');
            return next;
          });
        }
    } catch (error: any) {
      const errorContent = docName === 'Prototypes'
        ? `\`\`\`html\n<div class="flex flex-col items-center justify-center h-[90vh] text-center p-8 bg-slate-900 text-white font-sans">\n  <div class="bg-red-500/10 border border-red-500/50 p-6 rounded-xl max-w-lg">\n    <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />\n    </svg>\n    <h2 class="text-xl font-bold text-red-400 mb-2">Generation Failed</h2>\n    <p class="text-slate-300 text-sm mb-4">${error.message}</p>\n    <p class="text-slate-400 text-xs">Please try regenerating. The AI service may be temporarily unavailable.</p>\n  </div>\n</div>\n\`\`\``
        : docName === 'Wireframes'
        ? JSON.stringify({ summary: "Generation Failed", code: `{"error": "${error.message}", "message": "Please try regenerating. The AI service may be temporarily unavailable."}` })
        : docName === 'UML Diagrams'
        ? `\`\`\`plantuml\n@startuml\nrectangle "Generation Failed\\n\\nError: ${error.message}\\n\\nPlease try regenerating." as fail #ffcccc\n@enduml\n\`\`\``
        : `> [!WARNING]\n> **Generation Failed**\n> \n> \`\`\`\n> ${error.message}\n> \`\`\`\n> \n> Please try regenerating. The AI service may be temporarily unavailable.`;


      setDocuments(prev => ({
        ...prev,
        [docName]: { 
          ...prev[docName], 
          content: errorContent,
          confidence: 0,
          review: 'REQUIRED'
        }
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const saveProject = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return null;
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
        return newProj.id;
      }
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setIsProcessing(false);
    }
    return null;
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
    { icon: Cpu, label: "Logic Sandbox" },
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
    const isVisual = activeTab === 'Wireframes' || activeTab === 'Prototypes' || activeTab === 'Logic Sandbox';
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
        <title>${activeTab} â€” Gaurav Nandhan BA Studio</title>
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
            âš ï¸ This is the structured HTML/Tailwind source for the ${activeTab}. 
            Open the live application to view the interactive rendered preview.
          </div>
          <pre>${cleanText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        ` : mdToHtml(cleanText)}

        <div class="footer">
          <span>Gaurav Nandhan BA Studio â€” Enterprise Edition</span>
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
      // Don't auto-close â€” let user save as PDF from dialog
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
        <title>Full BA Report â€” Gaurav Nandhan BA Studio</title>
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
          <div class="badge">BABOK v3 Compliant Â· Enterprise Edition</div>
          <p style="color:#64748b;margin-top:30px;">Documents included: ${generated.join(' Â· ')}</p>
        </div>

        <div class="toc" style="page-break-before: always;">
          <h2>Table of Contents</h2>
          <ol>${generated.map((tab, i) => `<li>${tab}</li>`).join('')}</ol>
        </div>

        ${sectionsHtml}

        <div class="footer" style="page-break-before: avoid;">
          <span>Gaurav Nandhan BA Studio â€” Enterprise Edition</span>
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
      alert("âš ï¸ Please 'Save Session' first to generate a shareable link.");
      return;
    }
    const url = `${window.location.origin}/share/${currentProjectId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    prompt("Public Share Link generated! You can copy it directly from below:", url);
  };

  const activeProject = pastProjects.find(p => p.id === currentProjectId);

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
                        <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors mb-1 pr-8 flex items-center gap-2">
                          <span className="truncate">{p.title}</span>
                          {p.status === 'NEEDS_REVISION' && (
                            <span className="shrink-0 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded border border-red-500/30">Needs Revision</span>
                          )}
                          {p.status === 'APPROVED' && (
                            <span className="shrink-0 px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded border border-green-500/30">Approved</span>
                          )}
                        </div>
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

      {isPmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Select Project Manager</h3>
            <p className="text-sm text-slate-400 mb-6">Choose the PM who will review these documents.</p>
            {isLoadingPms ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching PMs...
              </div>
            ) : pmList.length === 0 ? (
              <div className="text-slate-400 text-sm mb-6">No PMs found in your organization. You can still submit unassigned.</div>
            ) : (
              <select 
                value={selectedPmId} 
                onChange={(e) => setSelectedPmId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 mb-6"
              >
                {pmList.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.name || pm.email}</option>
                ))}
              </select>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsPmModalOpen(false)} disabled={isSubmittingToPM} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handlePMSubmit} disabled={isSubmittingToPM} className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">{isSubmittingToPM ? "Submitting..." : "Submit to PM"}</button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-72 shrink-0 bg-[#1e293b]/80 border-r border-slate-700/50 backdrop-blur-xl flex flex-col shadow-2xl z-10 no-print">
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
              <a href="/templates" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                <FileText className="w-4 h-4" />
                Corporate Templates
              </a>
              <a href="/board" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                <LayoutDashboard className="w-4 h-4" />
                Kanban Board (PM)
              </a>
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
                        
                        // Trigger intelligence panel regeneration for the loaded project
                        const fullText = p.messages.map((m: any) => m.content).join('\n');
                        runAnalysis(fullText, p.messages);
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

          {/* Admin Panel link â€” ADMIN role only */}
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
                  {Math.min(readinessScore, 7)}/7
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    sessionState === 'READY' ? 'bg-emerald-400' :
                    readinessScore >= 3 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${(Math.min(readinessScore, 7) / 7) * 100}%` }}
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

      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e293b] via-[#0f172a] to-[#0f172a] relative">
        <header className="h-16 border-b border-slate-700/30 flex items-center justify-between px-4 sm:px-8 bg-[#0f172a]/50 backdrop-blur-md z-10 no-print">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2 shrink-0 mr-4">
            {activeTab === "Chat" ? <Bot className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
            {activeTab}
          </h2>
          <div className="flex gap-3 items-center overflow-x-auto overflow-y-hidden custom-scrollbar pb-1">
             <button onClick={saveProject} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 border border-slate-700 transition-colors">
               <Save className="w-4 h-4 text-blue-400" />
               Save Session
             </button>

             <button onClick={getShareLink} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
               <LinkIcon className="w-4 h-4" />
               Share Link
             </button>
             
             <button onClick={exportAllToPDF} className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 no-print">
               <Download className="w-3.5 h-3.5" />
               Export All (PDF)
             </button>

             <div className="relative group">
               <button 
                 disabled={isSubmittingToPM || !['BRD', 'FRD', 'UML Diagrams', 'Flowcharts', 'Wireframes', 'Prototypes', 'Test Cases'].every(type => !!documents[type])}
                 onClick={handleOpenPmModal}
                 className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 no-print disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 text-white"
               >
                 {isSubmittingToPM ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
                 {isSubmittingToPM ? "Submitting..." : "Submit to PM"}
               </button>
               {!['BRD', 'FRD', 'UML Diagrams', 'Flowcharts', 'Wireframes', 'Prototypes', 'Test Cases'].every(type => !!documents[type]) && (
                 <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-xs text-slate-300">
                   You need to generate BRD/FRD/Test cases/Wireframes/UML/Flowchart/Prototype in order to get this enabled.
                 </div>
               )}
             </div>

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
                        <option value="te">Telugu (à°¤à±†à°²à±à°—à±)</option>
                        <option value="hi">Hindi (à°¹à°¿à¤¨à¥à¤¦à¥€)</option>
                        <option value="ar">Arabic (Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©)</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 px-3 rounded-xl border border-slate-700/50">
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

        <div className="flex-1 flex overflow-hidden min-w-0">
          <div className="flex-1 flex flex-col min-w-0">
            {activeTab === "Chat" ? (
              <>
                  {activeProject?.status === 'NEEDS_REVISION' && activeProject?.pmFeedback && (
                    <div className="mx-10 mt-6 p-4 bg-red-900/40 border border-red-500/50 rounded-xl flex items-start gap-4 shrink-0 shadow-lg">
                      <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                      <div>
                        <h4 className="text-red-400 font-bold mb-1">Project Needs Revision (PM Feedback)</h4>
                        <p className="text-red-200 text-sm whitespace-pre-wrap">{activeProject.pmFeedback}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {chatMessages.map((msg, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} 
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} 
                            key={idx} 
                            className={`flex gap-6 max-w-4xl w-full ${msg.role === "assistant" ? "" : "ml-auto flex-row-reverse"}`}
                          >
                          <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl transition-transform hover:scale-110 ${msg.role === "assistant" ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-blue-500/10" : "bg-slate-800 border border-slate-700 text-slate-200"}`}>
                            {msg.role === "assistant" ? <Brain className="w-6 h-6" /> : <User className="w-6 h-6" />}
                          </div>
                          <div className={`p-6 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap shadow-2xl relative min-w-0 flex-1 overflow-x-auto ${msg.role === "assistant" ? "bg-[#1e293b]/90 backdrop-blur-xl border border-slate-700/50 text-slate-200 rounded-tl-sm" : "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-blue-600/20"}`}>
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
                      activeTab === "Logic Sandbox" ? (
                        <div className="p-4 h-full">
                           <DiagramErrorBoundary><LogicSandboxRenderer jsonString={documents[activeTab]?.content || ""} isProcessing={isProcessing} onRegenerate={() => handleDocumentClick(activeTab, true)} /></DiagramErrorBoundary>
                        </div>
                      ) : activeTab === "Wireframes" ? (
                                <div className="p-4 h-full">
                                  {(() => {
                                      const rawContent = documents[activeTab]?.content || "";
                                      let jsonString = rawContent;
                                      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/i);
                                      if (jsonMatch) jsonString = jsonMatch[1].trim();
                                      else {
                                        const tagStart = rawContent.indexOf('{');
                                        const tagEnd = rawContent.lastIndexOf('}');
                                        if (tagStart !== -1 && tagEnd !== -1 && tagEnd > tagStart) {
                                          jsonString = rawContent.substring(tagStart, tagEnd + 1).trim();
                                        }
                                      }
                                      let finalSchema = jsonString;
                                      try {
                                        const parsed = JSON.parse(jsonString);
                                        if (parsed.code) {
                                          finalSchema = typeof parsed.code === 'string' ? parsed.code : JSON.stringify(parsed.code);
                                        }
                                      } catch(e) {}

                                      if (!finalSchema || typeof finalSchema !== 'string' || finalSchema.length < 10) {
                                        return (
                                          <div className="p-8 bg-slate-900/80 border border-slate-700 rounded-2xl">
                                            <p className="text-slate-400 text-sm italic mb-4">Rendering system is preparing the UI schema. If it remains blank, please click "Edit" to view raw logic.</p>
                                            <pre className="text-[10px] text-slate-500 font-mono overflow-auto max-h-96">{rawContent}</pre>
                                          </div>
                                        );
                                      }

                                      return <DiagramErrorBoundary><DynamicUIBuilder schema={finalSchema} isProcessing={isProcessing} /></DiagramErrorBoundary>;
                                  })()}
                                </div>
                      ) : activeTab === "Prototypes" ? (
                                <div className="p-4 h-full">
                                  {(() => {
                                      const rawContent = documents[activeTab]?.content || "";
                                      let htmlContent = "";
                                      let summary = "";
                                      let jsonString = rawContent;
                                      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/i);
                                      if (jsonMatch) jsonString = jsonMatch[1].trim();
                                      else {
                                        const tagStart = rawContent.indexOf('{');
                                        const tagEnd = rawContent.lastIndexOf('}');
                                        if (tagStart !== -1 && tagEnd !== -1 && tagEnd > tagStart) {
                                          jsonString = rawContent.substring(tagStart, tagEnd + 1).trim();
                                        }
                                      }
                                      try {
                                        const parsed = JSON.parse(jsonString);
                                        htmlContent = typeof parsed.code === 'string' ? parsed.code : (parsed.code ? JSON.stringify(parsed.code) : "");
                                        summary = typeof parsed.summary === 'string' ? parsed.summary : (parsed.summary ? JSON.stringify(parsed.summary) : "");
                                      } catch (e) {
                                        let tempSummary = rawContent;
                                        const htmlMatch = tempSummary.match(/```(?:html|vue)\s*([\s\S]*?)(?:```|$)/i);
                                        if (htmlMatch) {
                                           htmlContent = htmlMatch[1].trim();
                                           tempSummary = tempSummary.replace(htmlMatch[0], '');
                                        }

                                        const jsMatch = tempSummary.match(/```(?:javascript|js)\s*([\s\S]*?)(?:```|$)/i);
                                        if (jsMatch) {
                                           htmlContent += `\n<script>\n${jsMatch[1].trim()}\n</script>\n`;
                                           tempSummary = tempSummary.replace(jsMatch[0], '');
                                        }
                                        
                                        // 3. Extract CSS block
                                        const cssMatch = tempSummary.match(/```css\s*([\s\S]*?)(?:```|$)/i);
                                        if (cssMatch) {
                                           htmlContent += `\n<style>\n${cssMatch[1].trim()}\n</style>\n`;
                                           tempSummary = tempSummary.replace(cssMatch[0], '');
                                        }
                                        
                                        // 4. Generic block fallback if nothing matched
                                        if (!htmlMatch && !jsMatch && !cssMatch) {
                                           const genericMatch = tempSummary.match(/```\s*([\s\S]*?)(?:```|$)/i);
                                           if (genericMatch) {
                                               htmlContent = genericMatch[1].trim();
                                               tempSummary = tempSummary.replace(genericMatch[0], '');
                                           } else if (rawContent.includes('<div') || rawContent.includes('<html')) {
                                               htmlContent = rawContent.trim();
                                               tempSummary = "";
                                           }
                                        }
                                        
                                        summary = tempSummary.trim();
                                      }
                                      return <DiagramErrorBoundary><LivePreviewIframe html={htmlContent} isProcessing={isProcessing} /></DiagramErrorBoundary>;
                                  })()}
                                </div>
                      ) : (activeTab === "Flowcharts" || activeTab === "UML Diagrams") ? (
                                <div className="p-4 h-full">
                                  {(() => {
                                      const rawContent = documents[activeTab]?.content || "";
                                      const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                                      const chartCode = match ? match[1].trim() : rawContent.trim();
                                      return <DiagramErrorBoundary><MermaidCanvas key={activeTab} chart={chartCode} isProcessing={isProcessing} /></DiagramErrorBoundary>;
                                  })()}
                                </div>
                      ) : (
                        <div className="prose prose-invert prose-slate max-w-none p-10 prose-headings:text-blue-100">
                          {(() => {
                            const content = documents[activeTab]?.content || "";
                            // Legacy plantuml/mermaid fallback renderer removed
                            // Fallback to text rendering for unknown tabs

                            const textDocs = ["BRD", "FRD", "PRD", "SRD", "Test Cases", "Executive Pitch", "Regulatory Advisor"];
                            const isTextDoc = textDocs.includes(activeTab);

                            return (
                              <>
                                {isTextDoc && !isProcessing ? (
                                  <CollaborativeEditor 
                                    initialContent={content} 
                                    projectId={currentProjectId || 'local'}
                                    graphNodes={graphNodes}
                                    graphEdges={graphEdges}
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
                                            // â”€â”€ DR-RUN Validation layer returns JSON now, not a stream â”€â”€
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
                                            // â”€â”€ DR-RUN Validation layer returns JSON now, not a stream â”€â”€
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
                    <div className="p-6 h-full overflow-y-auto">
                      <div className="max-w-6xl mx-auto">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Network className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Interactive Traceability Graph</h2>
                            <p className="text-slate-400 text-sm">Click any node to see its full text, upstream dependencies &amp; downstream artifacts. Red nodes are out of sync.</p>
                          </div>
                          <div className="ml-auto flex items-center gap-3">
                            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400">
                              {graphNodes.length} nodes · {graphEdges.length} links · <span className={staleDocs.size > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{staleDocs.size} stale</span>
                            </div>
                          </div>
                        </div>

                        <TraceabilityCanvas
                          graphNodes={graphNodes}
                          graphEdges={graphEdges}
                          staleDocs={staleDocs}
                          onRegenerateDoc={(docName) => handleDocumentClick(docName, true)}
                          documents={documents}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-slate-500">Select a document to generate.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar â€” Intelligence Panel (Restructured) */}
          <aside className="w-80 shrink-0 border-l border-slate-700/30 bg-[#0f172a]/50 backdrop-blur-md overflow-y-auto no-print flex flex-col custom-scrollbar">

            {/* â”€â”€ SECTION 0: Human Brain Agent â€” pinned headline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="p-4 border-b border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" /> Project Health
                </h3>
                {healthCheckResult && !healthCheckResult.error && (
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                    healthCheckResult.verdict === 'STRONG' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    healthCheckResult.verdict === 'FAIR'   ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    healthCheckResult.verdict === 'AT_RISK'? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {healthCheckResult.verdict?.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Score Bar */}
              {healthCheckResult && !healthCheckResult.error ? (
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <span className={`text-3xl font-black leading-none ${
                      healthCheckResult.overallHealthScore >= 75 ? 'text-emerald-400' :
                      healthCheckResult.overallHealthScore >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>{healthCheckResult.overallHealthScore}</span>
                    <span className="text-slate-500 text-sm pb-0.5">/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        healthCheckResult.overallHealthScore >= 75 ? 'bg-emerald-500' :
                        healthCheckResult.overallHealthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${healthCheckResult.overallHealthScore}%` }}
                    />
                  </div>
                  {healthCheckResult.nextBestAction && (
                    <p className="text-[10px] text-slate-400 leading-relaxed italic mt-1">
                      ðŸ’¡ {healthCheckResult.nextBestAction}
                    </p>
                  )}
                  <button onClick={() => setShowHealthCheck(s => !s)} className="text-[9px] text-violet-400 hover:text-violet-300 uppercase tracking-widest transition-colors">
                    {showHealthCheck ? 'Hide Details â†‘' : 'Show Details â†“'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Run a deep audit to get a full loophole report, health score, and expert verdict on your project.
                  </p>
                  
                  {/* DEMO BUTTON: Populate all features with realistic mock data */}
                  <button
                    onClick={loadDemoData}
                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 mb-2"
                  >
                    <Sparkles className="w-3 h-3" /> Load Interactive Demo Data
                  </button>

                  <button
                    onClick={runHealthCheck}
                    disabled={isRunningHealthCheck || chatMessages.length < 2}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    {isRunningHealthCheck
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Auditing...</>
                      : <><Brain className="w-3 h-3" /> Run Health Check</>}
                  </button>
                </div>
              )}

              {/* Expanded loophole detail */}
              {healthCheckResult && showHealthCheck && !healthCheckResult.error && healthCheckResult.loopholes?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-violet-500/20 space-y-2">
                  <div className="text-[9px] font-bold text-violet-400 uppercase tracking-tighter">
                    Loopholes ({healthCheckResult.loopholes.length})
                  </div>
                  {healthCheckResult.loopholes.slice(0, 4).map((l: any, i: number) => (
                    <div key={i} className={`p-2 rounded-lg border text-[9px] space-y-0.5 ${
                      l.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20' :
                      l.severity === 'HIGH'     ? 'bg-orange-500/10 border-orange-500/20' :
                                                  'bg-amber-500/10 border-amber-500/20'
                    }`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-200 text-[10px]">{l.title}</span>
                        <span className={`shrink-0 px-1 py-0.5 rounded text-[8px] font-black uppercase ${
                          l.severity === 'CRITICAL' ? 'bg-red-500/30 text-red-300' :
                          l.severity === 'HIGH'     ? 'bg-orange-500/30 text-orange-300' :
                                                      'bg-amber-500/30 text-amber-300'
                        }`}>{l.severity}</span>
                      </div>
                      <p className="text-slate-400 leading-snug">{l.description}</p>
                      {l.recommendation && <p className="text-violet-300/70 italic">💡 {l.recommendation}</p>}
                    </div>
                  ))}
                  {healthCheckResult.humanBrainInsight && (
                    <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                      <p className="text-[9px] text-slate-300 italic">"{healthCheckResult.humanBrainInsight}"</p>
                    </div>
                  )}
                  <button
                    onClick={runHealthCheck}
                    disabled={isRunningHealthCheck}
                    className="w-full py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1"
                  >
                    {isRunningHealthCheck ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
                    Re-run Audit
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 space-y-4 flex-1">

              {/* ── SECTION 1: ISSUES ── conflicts + regulatory + logic + gaps ─ */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Issues & Risks
                </h3>

                {/* ── Interactive Conflict Cards ── */}
                {(conflicts || []).length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-red-400 flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                      Requirement Conflicts
                    </div>
                    {(conflicts || []).map((c: any) => (
                      resolvedConflictIds.has(c.id) ? (
                        <div key={c.id} className="p-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 flex items-center gap-2">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-[9px] text-emerald-400/70 italic">{c.id} resolved</span>
                        </div>
                      ) : (
                        <div key={c.id} className={`p-2.5 rounded-xl border space-y-1.5 ${
                          c.severity === 'HIGH' ? 'bg-red-500/8 border-red-500/20' : 'bg-amber-500/8 border-amber-500/20'
                        }`}>
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                c.severity === 'HIGH' ? 'bg-red-500/25 text-red-300' : 'bg-amber-500/25 text-amber-300'
                              }`}>{c.severity || 'CONFLICT'}</span>
                              <span className="text-[9px] text-slate-500">{c.id}</span>
                            </div>
                            <button
                              onClick={() => { setActiveConflict(c); setIsConflictModalOpen(true); }}
                              className="text-[9px] font-bold text-violet-400 hover:text-violet-300 uppercase tracking-widest transition-colors border border-violet-500/30 hover:border-violet-400 px-2 py-0.5 rounded-lg"
                            >
                              Resolve →
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">{c.description}</p>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {(() => {
                  // Merge non-conflict issue types into one flat list
                  const allIssues: { severity: string; label: string; text: string; fix?: string }[] = [];

                  (regulatoryFlags || []).forEach((f: string) => allIssues.push({
                    severity: 'HIGH', label: 'Regulatory', text: f
                  }));
                  (logicAlerts || []).forEach((a: any) => allIssues.push({
                    severity: a.risk === 'HIGH' ? 'HIGH' : 'MEDIUM', label: 'Logic',
                    text: a.description
                  }));
                  (requirementGaps || []).forEach((g: any) => allIssues.push({
                    severity: g.severity === 'HIGH' ? 'HIGH' : 'MEDIUM', label: 'Gap',
                    text: g.gap
                  }));

                  if (isAnalyzing) {
                    return <div className="flex items-center gap-2 text-[10px] text-blue-400"><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</div>;
                  }

                  if (allIssues.length === 0 && (conflicts || []).length === 0) {
                    return <p className="text-[10px] text-slate-600 italic">No issues detected yet.</p>;
                  }

                  if (allIssues.length === 0) return null;

                  // Sort: CRITICAL â†’ HIGH â†’ MEDIUM â†’ LOW
                  const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                  allIssues.sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4));

                  return (
                    <div className="space-y-2">
                      {allIssues.slice(0, 6).map((issue, i) => (
                        <div key={i} className={`p-2.5 rounded-xl border space-y-1 ${
                          issue.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20' :
                          issue.severity === 'HIGH'     ? 'bg-orange-500/10 border-orange-500/20' :
                                                          'bg-amber-500/10 border-amber-500/20'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                              issue.severity === 'CRITICAL' ? 'bg-red-500/30 text-red-300' :
                              issue.severity === 'HIGH'     ? 'bg-orange-500/30 text-orange-300' :
                                                              'bg-amber-500/30 text-amber-300'
                            }`}>{issue.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">{issue.text}</p>
                          {issue.fix && <p className="text-[9px] text-slate-500 italic leading-snug">â†’ {issue.fix}</p>}
                        </div>
                      ))}
                      {allIssues.length > 6 && (
                        <p className="text-[9px] text-slate-600 italic pl-1">+{allIssues.length - 6} more issues â€” address the above first.</p>
                      )}
                      {(requirementGaps?.length > 0) && (
                        <button
                          onClick={() => setMomInput(prev => prev + '\n\nPlease address the following gaps:\n' + (requirementGaps || []).map((g: any) => `- ${g.gap}`).join('\n'))}
                          className="w-full py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700/50 transition-all text-[9px] font-bold uppercase tracking-widest"
                        >
                          Auto-Fill Gap Prompts
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="h-px bg-slate-800" />

              {/* â”€â”€ SECTION 2: INSIGHTS â€” SME + moats + billion dollar â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Insights & Opportunities
                </h3>

                {(() => {
                  const allInsights: { type: string; text: string; badge?: string }[] = [];

                  if (smeInsight) allInsights.push({ type: 'SME', text: smeInsight });

                  (strategicMoats || []).forEach((m: any) => allInsights.push({
                    type: 'Moat', text: m.observation, badge: m.type
                  }));

                  (billionDollarDisruptions || []).forEach((d: any) => allInsights.push({
                    type: 'Opportunity', text: d.impact, badge: `${d.title} Â· ${d.effort} effort`
                  }));

                  if (isAnalyzing) {
                    return <div className="flex items-center gap-2 text-[10px] text-blue-400"><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</div>;
                  }

                  if (allInsights.length === 0) {
                    return <p className="text-[10px] text-slate-600 italic">No insights identified yet.</p>;
                  }

                  return (
                    <div className="space-y-2">
                      {allInsights.slice(0, 5).map((ins, i) => (
                        <div key={i} className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black uppercase">
                              {ins.type}
                            </span>
                            {ins.badge && <span className="text-[8px] text-slate-500 truncate max-w-[120px]">{ins.badge}</span>}
                          </div>
                          <p className="text-[10px] text-amber-200/70 leading-snug italic">"{ins.text}"</p>
                        </div>
                      ))}
                      {allInsights.length > 5 && (
                        <p className="text-[9px] text-slate-600 italic pl-1">+{allInsights.length - 5} more insights</p>
                      )}
                      {smeInsight && (
                        <button
                          onClick={() => setMomInput(prev => prev + `\n\nRegarding the SME insight: ${smeInsight}`)}
                          className="text-[9px] font-bold text-amber-400 uppercase hover:underline"
                        >
                          Explore deeper â†’
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="h-px bg-slate-800" />

              {/* â”€â”€ SECTION 3: CHANGE RADAR â€” stale docs + version history â”€â”€â”€â”€ */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Change Radar
                </h3>

                {/* Stale Documents */}
                {staleDocs.size > 0 ? (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="text-[9px] font-bold text-red-400 uppercase tracking-tighter mb-2 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Documents Need Refresh
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(staleDocs).map((doc, i) => (
                        <button
                          key={i}
                          onClick={() => handleDocumentClick(doc, true)}
                          className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-[9px] font-bold text-red-300 uppercase tracking-tighter transition-all"
                          title={`Click to regenerate ${doc}`}
                        >
                          {doc}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-600 mt-2 italic">Click a document to regenerate it.</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-600 italic mb-3">All documents are up to date.</p>
                )}

                {/* Version history */}
                {scopeHistory.length > 1 && scopeHistory[scopeHistory.length - 1].impact ? (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                    <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Latest Scope Change</div>
                    <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                      {scopeHistory[scopeHistory.length - 1].impact.summary}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-slate-600">
                      <span>Version {scopeHistory.length}</span>
                      <span>{scopeHistory[scopeHistory.length - 1].timestamp}</span>
                    </div>
                    <button
                      onClick={() => setShowTimeline(true)}
                      className="w-full py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all text-[9px] font-bold uppercase tracking-widest"
                    >
                      View Full History
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-600 italic">No scope changes tracked yet.</p>
                )}
              </div>

              {/* â”€â”€ Analysis spinner (kept, but subtle) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              {isAnalyzing && (
                <div className="flex items-center gap-2 p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  <p className="text-[9px] text-blue-400 uppercase tracking-widest">Re-analyzing...</p>
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
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({inline, className, children, ...props}: any) { const match = /language-(\w+)/.exec(className || ''); if (!inline && match && match[1] === 'mermaid') { return <MermaidCanvas chart={String(children).replace(/\n$/, '')} /> } if (!inline && match && match[1] === 'plantuml') { return <MermaidCanvas chart={String(children).replace(/\n$/, '')} /> } if (!inline && (name === "Wireframes" || name === "Prototypes")) { return <div style={{ padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b', fontSize: '11px' }}>Interactive demo code excluded.</div>; } return <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }} {...props}>{children}</code> } }}>
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

                          {/* â”€â”€ Semantic Graph Traversal Paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                          {i === scopeHistory.length - 1 && lastTraversalPaths.length > 0 && (
                            <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                                <Network className="w-3 h-3" /> Graph Traversal â€” Downstream Impact
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

      {/* â”€â”€ Graph Impact Full Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

                {/* Impacted Nodes â€” grouped by type */}
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
                          <span className="text-cyan-300 shrink-0">â†’</span>
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

