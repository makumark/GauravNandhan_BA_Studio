"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, GitMerge, Check, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";

interface ConflictItem {
  id: string;
  description: string;
  resolution?: string;
  severity: string;
}

interface ConflictResolveModalProps {
  conflict: ConflictItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the final merged requirement text so page.tsx can update the FRD */
  onResolved: (conflictId: string, mergedText: string, deprecated: string) => void;
}

export function ConflictResolveModal({ conflict, isOpen, onClose, onResolved }: ConflictResolveModalProps) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [classification, setClassification] = useState<any>(null);
  const [choice, setChoice] = useState<'A' | 'B' | 'merge' | null>(null);
  const [resolved, setResolved] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  // Parse the conflict description into two statements
  // The AI returns description as "Statement A vs Statement B" or similar.
  // We extract them from the resolution field.
  const statementA = conflict?.description || '';
  const statementB = conflict?.resolution || '';
  const sourceA = 'Earlier Requirement';
  const sourceB = 'Updated Requirement';

  const handleResolve = async (picked: 'A' | 'B' | 'merge') => {
    if (!conflict) return;
    setChoice(picked);
    setIsClassifying(true);
    setClassification(null);

    try {
      const res = await fetch('/api/conflict/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementA,
          statementB,
          sourceA,
          sourceB,
          choice: picked,
        }),
      });

      if (!res.ok) throw new Error('Resolution failed');
      const data = await res.json();
      setClassification(data);

      // If contradictory and tried to merge — auto-show the warning (choice stays)
    } catch (e) {
      setClassification({ error: 'Could not classify conflict. Please try again.' });
    } finally {
      setIsClassifying(false);
    }
  };

  const confirmResolution = () => {
    if (!conflict || !classification) return;
    onResolved(
      conflict.id,
      classification.mergedRequirement || statementA,
      classification.deprecatedStatement || ''
    );
    setResolved(true);
    setTimeout(() => {
      setResolved(false);
      setClassification(null);
      setChoice(null);
      onClose();
    }, 1800);
  };

  const resetModal = () => {
    setClassification(null);
    setChoice(null);
    setResolved(false);
    setShowReasoning(false);
  };

  if (!conflict) return null;

  const isContradictory = classification?.conflictType === 'CONTRADICTORY';
  const canConfirm = classification && !classification.error && (choice !== 'merge' || !isContradictory);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { onClose(); resetModal(); }}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="relative w-full max-w-3xl bg-[#0f172a] border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-700/50 bg-red-500/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Conflict Resolution</h2>
                  <p className="text-xs text-slate-400">
                    <span className={`font-bold mr-1 ${conflict.severity === 'HIGH' ? 'text-red-400' : 'text-amber-400'}`}>
                      {conflict.severity}
                    </span>
                    {conflict.id}
                  </p>
                </div>
              </div>
              <button onClick={() => { onClose(); resetModal(); }} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-7 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">

              {/* Side-by-side statements */}
              <div className="grid grid-cols-2 gap-4">
                {/* Statement A */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">{sourceA}</span>
                  </div>
                  <div className={`bg-blue-500/8 border rounded-xl p-4 text-sm text-slate-300 leading-relaxed transition-all ${
                    choice === 'A' && classification ? 'border-blue-500/60 ring-1 ring-blue-500/30' : 'border-blue-500/20'
                  }`}>
                    {statementA}
                  </div>
                </div>
                {/* Statement B */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400">{sourceB}</span>
                  </div>
                  <div className={`bg-amber-500/8 border rounded-xl p-4 text-sm text-slate-300 leading-relaxed transition-all ${
                    choice === 'B' && classification ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-amber-500/20'
                  }`}>
                    {statementB || 'Awaiting second statement from resolution context.'}
                  </div>
                </div>
              </div>

              {/* Conflict type badge — shown after classification */}
              {classification && !classification.error && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-4 border space-y-2 ${
                    isContradictory
                      ? 'bg-red-500/8 border-red-500/25'
                      : 'bg-violet-500/8 border-violet-500/25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                        isContradictory ? 'bg-red-500/20 text-red-300' : 'bg-violet-500/20 text-violet-300'
                      }`}>
                        {isContradictory ? '⚠ Contradictory' : '✓ Additive'}
                      </span>
                      {classification.phaseNote && (
                        <span className="text-[10px] text-slate-500 italic">{classification.phaseNote}</span>
                      )}
                    </div>
                    <button onClick={() => setShowReasoning(r => !r)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300">
                      <Info className="w-3 h-3" />
                      {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showReasoning && (
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                      {classification.reasoning}
                    </p>
                  )}

                  {isContradictory && choice === 'merge' && (
                    <div className="flex items-start gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300 leading-snug">
                        These requirements are <strong>mutually exclusive</strong>. An AI merge is not logically possible.
                        Please use <strong>Keep A</strong> or <strong>Keep B</strong> instead.
                      </p>
                    </div>
                  )}

                  {!isContradictory && classification.mergedRequirement && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-violet-400">
                        {choice === 'merge' ? 'AI-Generated Phased Requirement' : 'Selected Requirement'}
                      </div>
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 text-sm text-slate-200 leading-relaxed">
                        {classification.mergedRequirement}
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        This will update the FRD in the document panel. Review and regenerate if needed.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {classification?.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
                  {classification.error}
                </div>
              )}

              {/* Action buttons */}
              {!resolved && (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                    Choose Resolution Action
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleResolve('A')}
                      disabled={isClassifying}
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                        choice === 'A' && classification && !isContradictory
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/40'
                      } disabled:opacity-40`}
                    >
                      {isClassifying && choice === 'A' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Keep A
                    </button>
                    <button
                      onClick={() => handleResolve('B')}
                      disabled={isClassifying}
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                        choice === 'B' && classification && !isContradictory
                          ? 'bg-amber-600 border-amber-400 text-white'
                          : 'bg-amber-600/20 border-amber-500/30 text-amber-300 hover:bg-amber-600/40'
                      } disabled:opacity-40`}
                    >
                      {isClassifying && choice === 'B' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Keep B
                    </button>
                    <button
                      onClick={() => handleResolve('merge')}
                      disabled={isClassifying || (classification?.conflictType === 'CONTRADICTORY')}
                      title={classification?.conflictType === 'CONTRADICTORY' ? 'Cannot merge contradictory requirements' : 'AI will create a phased/layered requirement'}
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                        choice === 'merge' && classification && !isContradictory
                          ? 'bg-violet-600 border-violet-400 text-white'
                          : 'bg-violet-600/20 border-violet-500/30 text-violet-300 hover:bg-violet-600/40'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isClassifying && choice === 'merge' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                      AI Phase Merge
                    </button>
                  </div>

                  {/* Confirm button */}
                  {canConfirm && !(isContradictory && choice === 'merge') && (
                    <motion.button
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      onClick={confirmResolution}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Confirm Resolution & Update FRD
                    </motion.button>
                  )}
                </div>
              )}

              {/* Success state */}
              {resolved && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8 gap-4"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Check className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-white mb-1">Conflict Resolved</p>
                    <p className="text-sm text-slate-400">FRD has been updated in the document panel</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
