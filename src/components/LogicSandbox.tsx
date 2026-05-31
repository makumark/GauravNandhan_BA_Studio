"use client";

import { useState } from 'react';
import { Cpu, Play } from 'lucide-react';

export const LogicSandboxRenderer = ({ jsonString, isProcessing }: { jsonString: string, isProcessing: boolean }) => {
  const [inputs, setInputs] = useState<any>({});
  const [result, setResult] = useState<string | null>(null);
  
  if (isProcessing && (!jsonString || jsonString.length < 10)) {
     return <div className="p-8 bg-slate-900/80 border border-slate-700 rounded-2xl m-4">
              <p className="text-slate-400 text-sm italic mb-4">Rendering system is preparing the logic sandbox...</p>
            </div>;
  }

  let schema: any = null;
  try {
     const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/i);
     const cleanJson = match ? match[1] : jsonString;
     const parsed = JSON.parse(cleanJson);
     schema = parsed.code || parsed;
  } catch(e) {
     return <div className="p-8 bg-slate-900 border border-red-500/50 rounded-2xl m-4"><p className="text-red-400">Failed to parse logic schema.</p><pre className="text-xs text-slate-500 mt-2">{jsonString}</pre></div>;
  }

  if (!schema || !schema.inputs || !schema.logic) return null;

  const handleRun = () => {
     try {
        const argNames = schema.inputs.map((i: any) => i.name);
        const argValues = schema.inputs.map((i: any) => {
           let val = inputs[i.name];
           if (val === undefined) val = i.defaultValue;
           if (i.type === 'number') return Number(val);
           if (i.type === 'boolean') return Boolean(val);
           return val;
        });
        const fn = new Function(...argNames, schema.logic);
        const out = fn(...argValues);
        setResult(String(out));
     } catch(e: any) {
        setResult("Error executing logic: " + e.message);
     }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl mx-auto mt-8">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-500"/> {schema.title || "Logic Sandbox"}</h3>
      <div className="space-y-4 mb-6">
        {schema.inputs.map((inp: any, i: number) => (
          <div key={i}>
            <label className="block text-sm font-medium text-slate-300 mb-1">{inp.label || inp.name}</label>
            {inp.type === 'select' ? (
               <select className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" value={inputs[inp.name] !== undefined ? inputs[inp.name] : (inp.defaultValue || "")} onChange={e => setInputs({...inputs, [inp.name]: e.target.value})}>
                 {inp.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
               </select>
            ) : inp.type === 'boolean' ? (
               <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={inputs[inp.name] !== undefined ? inputs[inp.name] : (inp.defaultValue || false)} onChange={e => setInputs({...inputs, [inp.name]: e.target.checked})} className="rounded bg-slate-800 border-slate-600" /> Enabled</label>
            ) : (
               <input type={inp.type === 'number' ? 'number' : 'text'} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" value={inputs[inp.name] !== undefined ? inputs[inp.name] : (inp.defaultValue || "")} onChange={e => setInputs({...inputs, [inp.name]: e.target.value})} />
            )}
          </div>
        ))}
      </div>
      <button onClick={handleRun} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
        <Play className="w-4 h-4" /> Run Business Rule
      </button>
      {result && (
        <div className={`mt-6 p-4 rounded-xl border ${result.startsWith('Error') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
           <span className="font-bold text-sm block mb-1">Execution Result:</span>
           <span className="font-mono text-sm">{result}</span>
        </div>
      )}
    </div>
  );
};
