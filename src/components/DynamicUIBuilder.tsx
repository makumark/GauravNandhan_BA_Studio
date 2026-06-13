'use client';

import React from 'react';
import { 
  UserCircle2, 
  Settings, 
  Menu, 
  Bell, 
  Search, 
  ChevronRight, 
  Loader2,
  AlertTriangle,
  LayoutDashboard,
  Users,
  CreditCard,
  Package
} from 'lucide-react';

export function DynamicUIBuilder({ schema, isProcessing }: { schema: string, isProcessing?: boolean }) {
  let parsedSchema;
  let parseError = '';
  try {
    let jsonStr = schema;
    const jsonMatch = schema.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const startIdx = schema.indexOf('{');
      const endIdx = schema.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonStr = schema.substring(startIdx, endIdx + 1).trim();
      }
    }
    
    try {
      parsedSchema = JSON.parse(jsonStr);
    } catch (e1: any) {
      try {
        parsedSchema = new Function("return " + jsonStr)();
      } catch (e2: any) {
         parseError = e1.message || 'Syntax Error';
         throw e1;
      }
    }
  } catch (e: any) {
    if (schema && typeof schema === 'string' && schema.includes('[Generation Error:')) {
      const errorMsgMatch = schema.match(/\[Generation Error:([^\]]+)\]/);
      const specificError = errorMsgMatch ? errorMsgMatch[1].trim() : 'AI Provider is busy (503 Service Unavailable).';
      return (
        <div className="p-8 bg-slate-900/80 border border-orange-500/30 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3 text-orange-400">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-bold uppercase tracking-widest text-sm">Service Temporarily Unavailable</h3>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed italic">The AI encountered a temporary issue while generating the layout. This is usually due to high demand.</p>
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400 max-h-32 overflow-y-auto custom-scrollbar font-mono">
            {specificError}
          </div>
          <button onClick={() => window.location.reload()} className="mt-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg transition-colors border border-slate-700">Please Try Again Later</button>
        </div>
      );
    }
    
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-2xl border border-slate-700/30 min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Rendering Component Engine...</p>
        </div>
      );
    }
    return (
      <div className="p-8 bg-slate-900/80 border border-red-500/30 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold uppercase tracking-widest text-sm">Component Registry Error</h3>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed italic">The AI generated an invalid component layout JSON.</p>
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 max-h-32 overflow-y-auto custom-scrollbar font-mono">
          {parseError || 'Syntax Error'}
          <div className="mt-2 text-[10px] text-red-400/70 whitespace-pre-wrap">{schema.substring(0, 500)}...</div>
        </div>
      </div>
    );
  }

  if (!parsedSchema || !parsedSchema.screens || !Array.isArray(parsedSchema.screens)) {
    if (isProcessing) return <div className="p-12 text-center text-slate-500 animate-pulse">Initializing Layouts...</div>;
    return <div className="p-4 text-slate-400">Invalid Schema Structure</div>;
  }

  const safeText = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      if (val.label) return String(val.label);
      if (val.text) return String(val.text);
      if (val.title) return String(val.title);
      if (val.value) return String(val.value);
      try { return JSON.stringify(val); } catch(e) { return ''; }
    }
    return String(val);
  };

  // Modern Component Registry Rendering
  const renderComponent = (comp: any, cIdx: string) => {
    if (!comp) return null;

    const key = `registry-${cIdx}`;
    
    // STRUCTURE: Grid
    if (comp.type === 'grid') {
      const cols = comp.cols || 2;
      return (
        <div key={key} className={`grid gap-4 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : cols === 4 ? 'grid-cols-4' : 'grid-cols-1'}`}>
          {Array.isArray(comp.children || comp.components) && (comp.children || comp.components).map((child: any, idx: number) => renderComponent(child, `${cIdx}-${idx}`))}
        </div>
      );
    }

    // STRUCTURE: Flex
    if (comp.type === 'flex') {
      const direction = comp.direction === 'col' ? 'flex-col' : 'flex-row';
      const justify = comp.justify === 'between' ? 'justify-between' : comp.justify === 'center' ? 'justify-center' : 'justify-start';
      const align = comp.align === 'center' ? 'items-center' : 'items-start';
      return (
        <div key={key} className={`flex ${direction} ${justify} ${align} gap-4`}>
          {Array.isArray(comp.children || comp.components) && (comp.children || comp.components).map((child: any, idx: number) => renderComponent(child, `${cIdx}-${idx}`))}
        </div>
      );
    }

    // COMPONENT: Card
    if (comp.type === 'card') {
      const themeClass = comp.theme === 'primary' 
        ? 'bg-blue-600/10 border-blue-500/30' 
        : comp.theme === 'secondary'
        ? 'bg-emerald-600/10 border-emerald-500/30'
        : 'bg-white/5 border-white/10';
        
      const textClass = comp.theme === 'primary' ? 'text-blue-400' : comp.theme === 'secondary' ? 'text-emerald-400' : 'text-slate-400';

      return (
        <div key={key} className={`p-6 rounded-2xl border backdrop-blur-md shadow-xl transition-all hover:scale-[1.02] ${themeClass}`}>
          {comp.title && <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${textClass}`}>{safeText(comp.title)}</h4>}
          {comp.value && <p className="text-3xl font-light text-white tracking-tight">{safeText(comp.value)}</p>}
          {comp.description && <p className="text-xs text-slate-500 mt-2">{safeText(comp.description)}</p>}
          
          {Array.isArray(comp.children || comp.components) && (
             <div className="mt-4 flex flex-col gap-3">
               {(comp.children || comp.components).map((child: any, idx: number) => renderComponent(child, `${cIdx}-${idx}`))}
             </div>
          )}
        </div>
      );
    }

    // COMPONENT: Navigation
    if (comp.type === 'nav') {
      return (
        <nav key={key} className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800 backdrop-blur-xl -mx-6 -mt-6 mb-6 rounded-t-2xl">
          <div className="flex items-center gap-6">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
            </div>
            {Array.isArray(comp.links) && comp.links.map((link: any, idx: number) => (
              <span key={idx} className={`text-sm font-medium cursor-pointer transition-colors ${idx === 0 ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {safeText(link)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Search className="w-4 h-4 text-slate-500" />
            <Bell className="w-4 h-4 text-slate-500" />
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              <UserCircle2 className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        </nav>
      );
    }

    // COMPONENT: Table
    if (comp.type === 'table') {
      return (
        <div key={key} className="w-full overflow-hidden border border-slate-800 rounded-xl bg-slate-900/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                {Array.isArray(comp.columns) && comp.columns.map((col: any, idx: number) => (
                  <th key={idx} className="px-6 py-4 font-medium">{safeText(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {Array.isArray(comp.rows) && comp.rows.map((row: any, rIdx: number) => (
                <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors group">
                  {Array.isArray(row) ? row.map((cell: any, cIdx: number) => (
                    <td key={cIdx} className="px-6 py-4 text-slate-300 group-hover:text-white transition-colors">{safeText(cell)}</td>
                  )) : (
                    <td className="px-6 py-4 text-slate-300">{safeText(row)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // COMPONENT: Input
    if (comp.type === 'input' || comp.type === 'text-input' || comp.type === 'password-input') {
      return (
        <div key={key} className="flex flex-col gap-1.5 w-full">
          {comp.label && <label className="text-xs font-medium text-slate-400">{safeText(comp.label)}</label>}
          <input 
            type={comp.type === 'password-input' ? 'password' : 'text'}
            placeholder={safeText(comp.placeholder)}
            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
          />
        </div>
      );
    }

    // COMPONENT: Button
    if (comp.type === 'button') {
      const isPrimary = comp.theme !== 'secondary' && comp.variant !== 'outline';
      return (
        <button key={key} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95 ${
          isPrimary 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/20' 
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        }`}>
          {safeText(comp.label || comp.text)}
        </button>
      );
    }

    // COMPONENT: Typography
    if (comp.type === 'typography' || comp.type === 'heading' || comp.type === 'text') {
      const variant = comp.variant || comp.type;
      if (variant === 'heading' || comp.level) {
        return <h3 key={key} className="text-xl font-bold text-white tracking-tight">{safeText(comp.text || comp.content)}</h3>;
      }
      return <p key={key} className="text-sm text-slate-400 leading-relaxed">{safeText(comp.text || comp.content)}</p>;
    }
    
    // COMPONENT: Badge
    if (comp.type === 'badge') {
      return (
        <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {safeText(comp.text || comp.label)}
        </span>
      );
    }

    // COMPONENT: Generic Section/Form
    if (comp.type === 'section' || comp.type === 'form' || comp.components || comp.children) {
      return (
        <div key={key} className="flex flex-col gap-4 p-6 bg-slate-800/20 border border-slate-800 rounded-2xl">
          {(comp.title || comp.label) && <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">{safeText(comp.title || comp.label)}</h3>}
          {Array.isArray(comp.components || comp.children) && (comp.components || comp.children).map((child: any, idx: number) => renderComponent(child, `${cIdx}-${idx}`))}
        </div>
      );
    }

    // Fallback Renderer
    const fallbackText = comp.text || comp.label || comp.title || comp.value || comp.content || comp.type;
    return (
      <div key={key} className="flex p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg text-sm text-slate-400 items-center justify-between">
        <span>{safeText(fallbackText)}</span>
        <span className="text-[10px] uppercase tracking-widest opacity-50 border border-slate-700 px-2 py-0.5 rounded-md">{comp.type}</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#0a0f1c] text-slate-100 rounded-3xl overflow-x-auto overflow-y-auto shadow-2xl flex flex-row gap-8 p-8 border border-slate-800">
      {parsedSchema.screens.map((screen: any, idx: number) => (
        <div key={idx} className="flex-none w-[800px] h-fit min-h-[600px] bg-slate-900 border border-slate-800 rounded-[2rem] flex flex-col p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-500/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6">
            {Array.isArray(screen.components) && screen.components.map((comp: any, cIdx: number) => renderComponent(comp, `${idx}-${cIdx}`))}
          </div>
        </div>
      ))}
    </div>
  );
}
