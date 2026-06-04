"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw } from "lucide-react";

interface ScopeCreepWidgetProps {
  projectId: string | null;
  /** In-memory scope history for projects not yet saved (non-logged-in users) */
  inMemoryTimeline?: { round: number; reqCount: number }[];
}

interface ScopeData {
  available: boolean;
  baselineCount?: number;
  latestCount?: number;
  creepPct?: number;
  verdict?: 'LOW' | 'MODERATE' | 'HIGH';
  timeline?: { round: number; reqCount: number; label: string }[];
  roundCount?: number;
}

export function ScopeCreepWidget({ projectId, inMemoryTimeline }: ScopeCreepWidgetProps) {
  const [data, setData] = useState<ScopeData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchScope = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/scope?projectId=${projectId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {/* silent */} finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchScope();
    }
  }, [projectId, fetchScope]);

  // ── In-memory fallback for non-saved projects ───────────────────────────
  const timeline = data?.timeline ?? (inMemoryTimeline?.map((t, i) => ({
    round: t.round,
    reqCount: t.reqCount,
    label: `Rnd ${t.round}`,
    date: '',
  })) ?? []);

  const baselineCount = data?.baselineCount ?? (inMemoryTimeline?.[0]?.reqCount ?? 0);
  const latestCount   = data?.latestCount   ?? (inMemoryTimeline?.[inMemoryTimeline.length - 1]?.reqCount ?? 0);
  const creepPct      = data?.creepPct      ?? (
    baselineCount > 0 ? Math.round(((latestCount - baselineCount) / baselineCount) * 100) : 0
  );
  const verdict       = data?.verdict ?? (creepPct >= 60 ? 'HIGH' : creepPct >= 30 ? 'MODERATE' : 'LOW');
  const available     = data?.available ?? (timeline.length >= 2);

  if (!available && timeline.length < 2) {
    return (
      <div className="p-3 bg-slate-800/30 border border-slate-700/40 rounded-xl">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" />
          Scope Creep Index
        </div>
        <p className="text-[10px] text-slate-600 italic leading-snug">
          Available after 2+ requirement rounds. Keep adding context to track drift.
        </p>
      </div>
    );
  }

  // ── SVG sparkline ────────────────────────────────────────────────────────
  const chartW = 200, chartH = 38;
  const counts = timeline.map(t => t.reqCount);
  const maxC = Math.max(...counts, 1);
  const pts = counts.map((c, i) => {
    const x = (i / Math.max(counts.length - 1, 1)) * (chartW - 8) + 4;
    const y = chartH - 4 - ((c / maxC) * (chartH - 8));
    return `${x},${y}`;
  }).join(' ');

  const verdictColor = verdict === 'HIGH' ? '#ef4444' : verdict === 'MODERATE' ? '#f59e0b' : '#10b981';
  const verdictBg    = verdict === 'HIGH' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                     : verdict === 'MODERATE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                     : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  const TrendIcon = creepPct > 5 ? TrendingUp : creepPct < -5 ? TrendingDown : Minus;

  return (
    <div className="p-3 bg-slate-800/30 border border-slate-700/40 rounded-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-amber-400" />
          Scope Creep Index
        </div>
        {loading
          ? <RefreshCw className="w-3 h-3 text-slate-600 animate-spin" />
          : projectId && (
              <button onClick={fetchScope} className="text-slate-600 hover:text-slate-400 transition-colors" title="Refresh">
                <RefreshCw className="w-3 h-3" />
              </button>
            )
        }
      </div>

      {/* Main metric */}
      <div className="flex items-end gap-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black leading-none" style={{ color: verdictColor }}>
              {creepPct > 0 ? '+' : ''}{creepPct}%
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            scope drift since round&nbsp;1
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 ml-auto">
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${verdictBg}`}>
            {verdict} RISK
          </span>
          <div className="flex items-center gap-1 text-[9px] text-slate-500">
            <TrendIcon className="w-3 h-3" style={{ color: verdictColor }} />
            <span>{baselineCount} → {latestCount} reqs</span>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      {timeline.length >= 2 && (
        <div>
          <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
            {/* Fill */}
            <polyline
              points={`4,${chartH} ${pts} ${(counts.length - 1) / Math.max(counts.length - 1, 1) * (chartW - 8) + 4},${chartH}`}
              fill={verdictColor}
              opacity="0.08"
            />
            {/* Line */}
            <polyline
              points={pts}
              fill="none"
              stroke={verdictColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots */}
            {pts.split(' ').map((pt, i) => {
              const [x, y] = pt.split(',');
              return <circle key={i} cx={x} cy={y} r="2.5" fill={verdictColor} />;
            })}
          </svg>
          <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
            <span>Round 1 (Baseline)</span>
            <span>Now</span>
          </div>
        </div>
      )}

      {/* Scope freeze badge */}
      {verdict === 'HIGH' && (
        <div className="flex items-start gap-2 p-2 bg-red-500/8 border border-red-500/20 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-300/80 leading-snug">
            <span className="font-bold">Scope Freeze Recommended.</span> Requirements have grown {creepPct}% since baseline. Consider a scope review before adding new requirements.
          </p>
        </div>
      )}
    </div>
  );
}
