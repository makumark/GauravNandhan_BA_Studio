import { useState, useEffect } from "react";
import pako from 'pako';
import { Loader2, AlertTriangle, ExternalLink, Code, ChevronDown } from 'lucide-react';

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

export function PlantUMLRenderer({ code, isProcessing }: { code: string, isProcessing?: boolean }) {
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
