import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2 } from 'lucide-react';

export function LivePreviewIframe({ htmlContent, isProcessing, summary }: { htmlContent: string, isProcessing?: boolean, summary: string }) {
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
  if ((fullHtml.includes('function') || fullHtml.includes('const') || fullHtml.includes('let')) && !fullHtml.includes('<script') && !fullHtml.includes('<div') && !fullHtml.includes('<span') && !fullHtml.includes('x-data')) {
    const scriptRegex = /(function\s+\w+\(\)[\s\S]*?\n\s*\}\s*\n?)/g;
    const scripts = fullHtml.match(scriptRegex);
    if (scripts) {
      const scriptBlock = \`<script>\n\${scripts.join('\n')}\n</script>\`;
      fullHtml = fullHtml.replace(scriptRegex, '') + '\n' + scriptBlock;
    }
  }

  if (!fullHtml.toLowerCase().includes('<html')) {
    fullHtml = \`
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
        \${fullHtml}
      </body>
      </html>\`.trim();
  } else {
    // Inject tailwind and alpine if missing
    if (!fullHtml.includes('tailwindcss.com')) {
      fullHtml = fullHtml.replace(/<\\/head>/i, '<script src="https://cdn.tailwindcss.com"></script>\n</head>');
    }
    if (!fullHtml.includes('alpinejs')) {
      fullHtml = fullHtml.replace(/<\\/head>/i, '<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>\n</head>');
    }
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
          sandbox="allow-scripts allow-forms allow-modals"
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
