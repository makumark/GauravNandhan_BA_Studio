"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { KanbanBoard } from "@/components/features/project-management/KanbanBoard";
import { LayoutDashboard, LogOut, ArrowLeft, Loader2, Target, FileText, Download } from "lucide-react";
import { signOut } from "next-auth/react";
import ReactMarkdown from 'react-markdown';
import { DiagramErrorBoundary } from '@/components/DiagramErrorBoundary';
import { LivePreviewIframe } from '@/components/features/editors/LivePreviewIframe';
import { ReactFlowCanvas } from '@/components/features/editors/ReactFlowCanvas';
import { DynamicUIBuilder } from '@/components/DynamicUIBuilder';

export default function BoardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'KANBAN' | 'DOCUMENTS'>('KANBAN');
  const [activeDocType, setActiveDocType] = useState<string>('BRD');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [pmFeedback, setPmFeedback] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleProjectStatusUpdate = async (status: string) => {
    if (!selectedProjectId) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, pmFeedback: status === 'NEEDS_REVISION' ? pmFeedback : undefined })
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, status, pmFeedback: status === 'NEEDS_REVISION' ? pmFeedback : null } : p));
        setIsRejectModalOpen(false);
        setPmFeedback("");
        alert(`Project marked as ${status}`);
      } else {
        alert("Failed to update status");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const role = (session?.user as any)?.role;
  const isPMorBA = role === 'PM' || role === 'BA_LEAD' || role === 'BA_ANALYST' || role === 'ADMIN';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setProjects(data);
            if (data.length > 0) setSelectedProjectId(data[0].id);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const exportAllToPDF = () => {
    if (!selectedProjectId) return;
    const projDocs = projects.find(p => p.id === selectedProjectId)?.documents || [];
    const documents = projDocs.reduce((acc: any, d: any) => { acc[d.type] = d; return acc; }, {});
    
    const docTabs = ['BRD', 'FRD', 'PRD', 'SRD', 'Executive Pitch', 'Test Cases', 'UML Diagrams', 'Flowcharts'];
    const generated = docTabs.filter(tab => documents[tab]?.content && documents[tab].content.trim().length > 50);

    if (generated.length === 0) {
      alert('No documents generated yet for this project.');
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
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          if (!inList) { html += '<ul style="margin:8px 0; padding-left:20px;">'; inList = true; }
          html += `<li style="margin:4px 0;">${trimmed.slice(2)}</li>`;
          return;
        } else if (inList && trimmed !== '') {
          if (!(trimmed.startsWith('- ') || trimmed.startsWith('* '))) { html += '</ul>'; inList = false; }
        } else if (inList && trimmed === '') { html += '</ul>'; inList = false; }

        if (trimmed.startsWith('|')) {
          if (!inTable) { html += '<table style="border-collapse:collapse; width:100%; margin:16px 0; border:1px solid #e2e8f0; font-size:9pt;">'; inTable = true; tableRowIndex = 0; }
          if (trimmed.match(/^[\s|:-]+$/)) return;
          const cells = trimmed.replace(/^\||\|$/g, '').split('|');
          html += `<tr style="${tableRowIndex % 2 === 0 ? '' : 'background-color:#f8fafc;'}">`;
          cells.forEach(cell => {
            const content = cell.trim();
            if (tableRowIndex === 0) html += `<th style="border:1px solid #e2e8f0; padding:8px; background-color:#1e40af; color:white; text-align:left; font-weight:bold;">${content}</th>`;
            else html += `<td style="border:1px solid #e2e8f0; padding:8px; text-align:left; vertical-align:top;">${content}</td>`;
          });
          html += '</tr>';
          tableRowIndex++;
          return;
        } else if (inTable) { html += '</table>'; inTable = false; }

        if (line.startsWith('### ')) { html += `<h3 style="color:#2563eb; margin-top:16px;">${line.slice(4)}</h3>`; return; }
        if (line.startsWith('## ')) { html += `<h2 style="color:#1e40af; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-top:20px;">${line.slice(3)}</h2>`; return; }
        if (line.startsWith('# ')) { html += `<h1 style="color:#1e3a5f; border-bottom:2px solid #2563eb; padding-bottom:8px; margin-top:24px;">${line.slice(2)}</h1>`; return; }
        if (trimmed === '') { html += '<div style="height:8px;"></div>'; return; }
        html += `<p style="margin:4px 0 8px 0; color:#334155;">${line}</p>`;
      });

      if (inTable) html += '</table>';
      if (inList) html += '</ul>';
      return html;
    };

    let umlImgTag = '';
    const sectionsHtml = generated.map(tab => {
        const docContent = documents[tab]?.content || '';
        return `
          <div style="page-break-before: always; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h1 style="border:none; margin:0;">${tab}</h1>
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
        <title>PM Report</title>
        <style>
          @page { margin: 20mm; size: A4; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.6; }
          .cover { text-align: center; padding: 80px 40px; }
          .cover h1 { font-size: 28pt; color: #1e3a5f; }
          .cover h2 { font-size: 16pt; color: #2563eb; font-weight: normal; }
          .toc h2 { color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          .toc li { margin: 6px 0; color: #2563eb; font-size: 12pt; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 9pt; }
          td, th { border: 1px solid #e2e8f0; padding: 5px 8px; text-align: left; }
          th { background: #1e40af; color: white; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>Project Documents</h1>
          <h2>Business Analysis Report</h2>
          <p style="color:#64748b;margin-top:30px;">Documents included: ${generated.join(' Â· ')}</p>
        </div>
        <div class="toc" style="page-break-before: always;">
          <h2>Table of Contents</h2>
          <ul>${generated.map(g => `<li>${g}</li>`).join('')}</ul>
        </div>
        ${sectionsHtml}
        <script>window.onload = function() { setTimeout(function(){ window.print(); }, 800); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups to export PDF.");
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-300 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-lg text-white">Project Management</h1>
          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {role}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isPMorBA && (
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 bg-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to BA Studio
            </button>
          )}

          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-white">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <button onClick={() => signOut()} className="p-2 text-slate-500 hover:text-white transition-colors" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Reject Project</h3>
            <p className="text-sm text-slate-400 mb-6">Provide feedback to the BA regarding what needs to be fixed in the documents.</p>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-red-500/50 min-h-[120px] mb-6"
              placeholder="E.g., The payment gateway edge cases are missing from the FRD..."
              value={pmFeedback}
              onChange={(e) => setPmFeedback(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsRejectModalOpen(false)} disabled={isUpdatingStatus} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={() => handleProjectStatusUpdate('NEEDS_REVISION')} disabled={isUpdatingStatus || !pmFeedback.trim()} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">{isUpdatingStatus ? "Updating..." : "Send Back"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-[#0f172a]/50 p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-2">Your Projects</h2>
          
          {projects.length === 0 ? (
            <div className="text-sm text-slate-500 px-2">No projects found.</div>
          ) : (
            <div className="space-y-1">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    selectedProjectId === p.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Target className="w-4 h-4 shrink-0" />
                  <span className="truncate">{p.title}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main Board Area */}
        <main className="flex-1 overflow-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e293b] via-[#0f172a] to-[#0f172a]">
          {selectedProjectId ? (
            <div className="h-full flex flex-col">
              {/* Tab Switcher */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
                 <div className="flex items-center gap-4">
                   <button onClick={() => setActiveView('KANBAN')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'KANBAN' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                     <LayoutDashboard className="w-4 h-4" />
                     Kanban Board
                   </button>
                   <button onClick={() => setActiveView('DOCUMENTS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'DOCUMENTS' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                     <FileText className="w-4 h-4" />
                     Project Documents
                   </button>
                 </div>
                 
                 {activeView === 'DOCUMENTS' && (
                   <div className="flex items-center gap-2">
                     <button onClick={() => setIsRejectModalOpen(true)} className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-600/30 transition-all active:scale-95 flex items-center gap-2">
                       Reject & Send Back
                     </button>
                     <button onClick={() => handleProjectStatusUpdate('APPROVED')} disabled={isUpdatingStatus} className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-600/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50">
                       Approve Project
                     </button>
                     <button onClick={exportAllToPDF} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 text-white">
                       <Download className="w-4 h-4" />
                       Export PDF
                     </button>
                   </div>
                 )}
              </div>

              {activeView === 'KANBAN' ? (
                <div className="flex-1 min-h-0">
                  <KanbanBoard projectId={selectedProjectId} />
                </div>
              ) : (
                <div className="flex-1 flex gap-6 overflow-hidden bg-[#0f172a]/80 p-6 rounded-2xl border border-slate-800 shadow-2xl">
                   {/* Left side: Doc Tabs */}
                   <div className="w-56 border-r border-slate-800 pr-4 space-y-2 shrink-0 overflow-y-auto">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 pl-2">Generated Docs</h3>
                      {projects.find(p => p.id === selectedProjectId)?.documents?.map((d: any) => (
                         <button key={d.type} onClick={() => setActiveDocType(d.type)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeDocType === d.type ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                           {d.type}
                         </button>
                      ))}
                   </div>
                   {/* Right side: Doc Content */}
                   <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-20">
                      {(() => {
                        const rawContent = projects.find(p => p.id === selectedProjectId)?.documents?.find((d: any) => d.type === activeDocType)?.content || "";
                        if (!rawContent) return <div className="text-slate-500">No document available for this section.</div>;

                        if (activeDocType === "Wireframes") {
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
                              return <div className="text-slate-500">{rawContent || "Waiting for Wireframes..."}</div>;
                            }
                            return <div className="h-[600px]"><DynamicUIBuilder schema={finalSchema} isProcessing={false} /></div>;
                        }

                        if (activeDocType === "Prototypes") {
                            let htmlContent = "";
                            let summary = "";
                            try {
                              let tempSummary = rawContent;
                              // Check if it's JSON first
                              const jsonMatch = tempSummary.match(/```json\s*([\s\S]*?)\s*```/i);
                              let jsonString = null;
                              if (jsonMatch) jsonString = jsonMatch[1].trim();
                              else if (tempSummary.trim().startsWith('{')) jsonString = tempSummary.trim();
                              
                              if (jsonString) {
                                try {
                                  const parsed = JSON.parse(jsonString);
                                  if (parsed.code) htmlContent = parsed.code;
                                  if (parsed.summary) summary = parsed.summary;
                                } catch(e) {}
                              }
                              
                              if (!htmlContent) {
                                const htmlMatch = tempSummary.match(/```(?:html|vue)\s*([\s\S]*?)(?:```|$)/i);
                                if (htmlMatch) { htmlContent = htmlMatch[1].trim(); tempSummary = tempSummary.replace(htmlMatch[0], ''); }
                                const jsMatch = tempSummary.match(/```(?:javascript|js)\s*([\s\S]*?)(?:```|$)/i);
                                if (jsMatch) { htmlContent += `\n<script>\n${jsMatch[1].trim()}\n</script>\n`; tempSummary = tempSummary.replace(jsMatch[0], ''); }
                                const cssMatch = tempSummary.match(/```css\s*([\s\S]*?)(?:```|$)/i);
                                if (cssMatch) { htmlContent += `\n<style>\n${cssMatch[1].trim()}\n</style>\n`; tempSummary = tempSummary.replace(cssMatch[0], ''); }
                                if (!htmlMatch && !jsMatch && !cssMatch) {
                                   const genericMatch = tempSummary.match(/```\s*([\s\S]*?)(?:```|$)/i);
                                   if (genericMatch) { htmlContent = genericMatch[1].trim(); tempSummary = tempSummary.replace(genericMatch[0], ''); }
                                   else { htmlContent = tempSummary.trim(); tempSummary = ""; }
                                }
                                summary = tempSummary.trim();
                              }
                            } catch(e) {}
                            return <div className="h-[600px]"><DiagramErrorBoundary><LivePreviewIframe htmlContent={htmlContent} isProcessing={false} summary={summary} /></DiagramErrorBoundary></div>;
                        }

                        if (activeDocType === "Flowcharts" || activeDocType === "UML Diagrams") {
                            const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                            const chartCode = match ? match[1].trim() : rawContent.trim();
                            return <div className="h-[600px]"><DiagramErrorBoundary><ReactFlowCanvas key={activeDocType} chart={chartCode} isProcessing={false} /></DiagramErrorBoundary></div>;
                        }

                        return (
                          <div className="prose prose-invert prose-blue max-w-none">
                            <ReactMarkdown>{rawContent}</ReactMarkdown>
                          </div>
                        );
                      })()}
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a project to view its Kanban board.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
