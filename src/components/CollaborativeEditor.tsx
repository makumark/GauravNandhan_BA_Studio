"use client";

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Wand2, Check, X, Loader2 } from 'lucide-react';

interface CollaborativeEditorProps {
  initialContent: string;
  documentId?: string; // Optional for now, useful if we save back to DB
  onUpdate?: (markdown: string) => void;
}

export function CollaborativeEditor({ initialContent, documentId, onUpdate }: CollaborativeEditorProps) {
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    originalText: string;
    suggestedText: string;
    from: number;
    to: number;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.storage.markdown.getMarkdown());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none bg-slate-900/50 p-6 rounded-lg min-h-[500px]',
      },
    },
  });

  // Keep content in sync if initialContent changes significantly (e.g. switching tabs)
  useEffect(() => {
    if (editor && initialContent !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const handleRewriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || !rewriteInstruction) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText) return;

    setIsRewriting(true);
    try {
      const response = await fetch('/api/document/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          instruction: rewriteInstruction
        }),
      });

      const data = await response.json();
      const suggestedText = data.suggestedText || data.error;

      setPendingSuggestion({
        originalText: selectedText,
        suggestedText,
        from,
        to
      });
      setRewriteInstruction('');
    } catch (err) {
      console.error('Rewrite failed', err);
    } finally {
      setIsRewriting(false);
    }
  };

  const applySuggestion = () => {
    if (!editor || !pendingSuggestion) return;
    editor.chain().focus()
      .deleteRange({ from: pendingSuggestion.from, to: pendingSuggestion.to })
      .insertContentAt(pendingSuggestion.from, pendingSuggestion.suggestedText)
      .run();
    setPendingSuggestion(null);
  };

  const rejectSuggestion = () => {
    setPendingSuggestion(null);
  };

  if (!editor) return null;

  return (
    <div className="relative">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
          <form onSubmit={handleRewriteSubmit} className="flex items-center px-2 py-1">
            <Wand2 size={16} className="text-blue-400 mr-2" />
            <input
              type="text"
              placeholder="Ask AI to rewrite..."
              className="bg-transparent border-none text-sm text-white placeholder-slate-400 focus:outline-none w-48 py-1"
              value={rewriteInstruction}
              onChange={(e) => setRewriteInstruction(e.target.value)}
              disabled={isRewriting}
            />
            {isRewriting && <Loader2 size={14} className="animate-spin text-slate-400 ml-2" />}
          </form>
        </BubbleMenu>
      )}

      {pendingSuggestion && (
        <div className="absolute top-4 right-4 w-80 bg-slate-800 border border-blue-500/50 rounded-lg shadow-2xl p-4 z-50">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <Wand2 size={14} className="text-blue-400 mr-2" />
              AI Suggestion
            </h4>
            <div className="flex gap-2">
              <button onClick={applySuggestion} className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors">
                <Check size={16} />
              </button>
              <button onClick={rejectSuggestion} className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="text-sm">
            <div className="mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Original:</span>
              <p className="line-through text-red-300 mt-1">{pendingSuggestion.originalText}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Suggested:</span>
              <p className="text-green-300 mt-1">{pendingSuggestion.suggestedText}</p>
            </div>
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
