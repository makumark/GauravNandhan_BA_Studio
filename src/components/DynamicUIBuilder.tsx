'use client';

import React from 'react';

// Example structured JSON:
// { "screens": [{ "id": "dashboard", "title": "Dashboard", "layout": "sidebar-main", "components": [...] }] }

export function DynamicUIBuilder({ schema }: { schema: string }) {
  let parsedSchema;
  try {
    // We expect the LLM to output a JSON string, possibly wrapped in markdown backticks
    const jsonStr = schema.replace(/```json/g, '').replace(/```/g, '').trim();
    parsedSchema = JSON.parse(jsonStr);
  } catch (e) {
    return (
      <div className="p-4 bg-red-900/50 text-red-200 border border-red-500 rounded-md">
        <h3 className="font-bold">UI Render Error</h3>
        <p>The AI generated invalid JSON schema. The self-healing agent has been notified.</p>
        <pre className="mt-2 text-xs opacity-50">{schema}</pre>
      </div>
    );
  }

  if (!parsedSchema || !parsedSchema.screens) {
    return <div className="p-4 text-white">Awaiting UI Schema...</div>;
  }

  return (
    <div className="dynamic-ui-container w-full h-full bg-slate-900 text-slate-100 rounded-lg overflow-hidden shadow-2xl flex border border-slate-700">
      {parsedSchema.screens.map((screen: any, idx: number) => (
        <div key={idx} className="flex-1 flex flex-col p-6 overflow-y-auto">
          <h2 className="text-2xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            {screen.title || screen.id}
          </h2>
          <div className="flex flex-col gap-6">
            {screen.components?.map((comp: any, cIdx: number) => {
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
              // Fallback
              return <div key={cIdx} className="p-4 bg-slate-800 rounded">{JSON.stringify(comp)}</div>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
