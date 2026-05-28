'use client';

import React from 'react';

// Example structured JSON:
// { "screens": [{ "id": "dashboard", "title": "Dashboard", "layout": "sidebar-main", "components": [...] }] }

export function DynamicUIBuilder({ schema, isProcessing }: { schema: string, isProcessing?: boolean }) {
  let parsedSchema;
  try {
    // We expect the LLM to output a JSON string, possibly wrapped in markdown backticks
    const jsonStr = schema.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
      parsedSchema = JSON.parse(jsonStr);
    } catch (e1) {
      // Fallback for LLM hallucinations like trailing commas or unquoted keys
      parsedSchema = new Function("return " + jsonStr)();
    }
  } catch (e) {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-2xl border border-slate-700/30 min-h-[300px]">
          <div className="w-8 h-8 animate-spin border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">Generating UI Schema...</p>
        </div>
      );
    }
    return (
      <div className="p-4 bg-red-900/50 text-red-200 border border-red-500 rounded-md">
        <h3 className="font-bold">UI Render Error</h3>
        <p>The AI generated invalid JSON schema. The self-healing agent has been notified.</p>
        <pre className="mt-2 text-xs opacity-50 whitespace-pre-wrap">{schema}</pre>
      </div>
    );
  }

  if (!parsedSchema || !parsedSchema.screens) {
    return <div className="p-4 text-white">Awaiting UI Schema...</div>;
  }

  const renderComponent = (comp: any, cIdx: string | number) => {
    if (comp.type === 'progress-bar') {
      const percent = comp.totalSteps ? Math.round((comp.currentStep / comp.totalSteps) * 100) : 50;
      return (
        <div key={cIdx} className="w-full">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{comp.label || `Step ${comp.currentStep}`}</span>
            <span>{percent}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
          </div>
        </div>
      );
    }
    if (comp.type === 'heading') {
      return React.createElement(`h${comp.level || 2}`, { key: cIdx, className: "text-lg font-bold text-slate-100 mt-2" }, comp.text);
    }
    if (comp.type === 'text' || comp.type === 'paragraph') {
      return <p key={cIdx} className="text-sm text-slate-300 leading-relaxed">{comp.content || comp.text}</p>;
    }
    if (comp.type === 'input' || comp.type === 'text-input' || comp.type === 'date-input' || comp.type === 'email-input' || comp.type === 'number-input' || comp.type === 'select' || comp.type === 'dropdown' || comp.type === 'textarea') {
      return (
        <div key={cIdx} className="flex flex-col gap-1">
          {comp.label && <label className="text-xs font-semibold text-slate-400 uppercase">{comp.label} {(comp.mandatory || comp.required) && <span className="text-red-400">*</span>}</label>}
          {comp.type === 'textarea' ? (
            <textarea placeholder={comp.placeholder} className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-200 min-h-[80px]" disabled={comp.disabled} />
          ) : (comp.type === 'select' || comp.type === 'dropdown') ? (
            <select className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-200" disabled={comp.disabled}>
              <option value="">{comp.placeholder || "Select option..."}</option>
              {comp.options?.map((opt: string, optIdx: number) => <option key={optIdx} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input type={comp.type === 'tel' ? 'tel' : comp.type === 'date-input' ? 'date' : comp.type === 'email-input' ? 'email' : comp.type === 'number-input' ? 'number' : 'text'} placeholder={comp.placeholder} className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-200" disabled={comp.disabled} />
          )}
        </div>
      );
    }
    if (comp.type === 'link') {
      return (
        <a key={cIdx} href="#" className="text-sm text-blue-400 hover:text-blue-300 underline mt-2 inline-block">
          {comp.text || comp.label}
        </a>
      );
    }
    if (comp.type === 'button') {
      const isPrimary = comp.variant !== 'secondary';
      return (
        <button key={cIdx} className={`px-4 py-2 mt-2 rounded-lg text-sm font-bold transition-all ${isPrimary ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'} ${comp.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {comp.text || comp.label}
        </button>
      );
    }
    if (comp.type === 'nav') {
      return (
        <nav key={cIdx} className="flex gap-4 border-b border-slate-700 pb-4">
          {comp.links?.map((link: string, lIdx: number) => (
            <button key={lIdx} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">{link}</button>
          ))}
        </nav>
      );
    }
    if (comp.type === 'card') {
      return (
        <div key={cIdx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl">
          <h4 className="text-sm text-slate-400 uppercase tracking-wider">{comp.title}</h4>
          <p className="text-4xl font-light text-white mt-2">{comp.value}</p>
        </div>
      );
    }
    if (comp.type === 'table') {
      return (
        <div key={cIdx} className="overflow-x-auto border border-slate-700 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                {comp.columns?.map((col: string, colIdx: number) => (
                  <th key={colIdx} className="p-3 font-semibold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {comp.rows?.map((row: any[], rowIdx: number) => (
                <tr key={rowIdx} className="hover:bg-slate-800/50 transition-colors">
                  {row.map((cell: any, cellIdx: number) => (
                    <td key={cellIdx} className="p-3 text-slate-300">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (comp.type === 'section' || comp.type === 'conditional_group' || comp.components) {
      return (
        <div key={cIdx} className="flex flex-col gap-3 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
          {(comp.title || comp.label) && <h3 className="text-sm font-bold text-slate-200">{comp.title || comp.label}</h3>}
          {comp.components?.map((childComp: any, childIdx: number) => renderComponent(childComp, `${cIdx}-${childIdx}`))}
        </div>
      );
    }
    // Fallback
    return <div key={cIdx} className="p-3 bg-slate-800/80 border border-slate-700 rounded text-xs font-mono break-all">{JSON.stringify(comp)}</div>;
  };

  return (
    <div className="dynamic-ui-container w-full h-full bg-slate-900 text-slate-100 rounded-lg overflow-x-auto overflow-y-auto shadow-2xl flex flex-row gap-6 p-6 border border-slate-700">
      {parsedSchema.screens.map((screen: any, idx: number) => (
        <div key={idx} className="flex-none w-[400px] h-fit bg-slate-800/50 border border-slate-700 rounded-2xl flex flex-col p-6 shadow-lg">
          <h2 className="text-2xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            {screen.title || screen.id}
          </h2>
          <div className="flex flex-col gap-4">
            {screen.components?.map((comp: any, cIdx: number) => renderComponent(comp, cIdx))}
          </div>
        </div>
      ))}
    </div>
  );
}
