// ── Scope Creep API ────────────────────────────────────────────────────────
// GET /api/scope?projectId=xxx
// Returns scope creep metrics: baseline vs current req count, timeline, risk verdict

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const snapshots = await prisma.scopeSnapshot.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      select: { round: true, reqCount: true, createdAt: true },
    });

    if (snapshots.length === 0) {
      return NextResponse.json({ available: false });
    }

    const baselineCount = snapshots[0].reqCount;
    const latestCount   = snapshots[snapshots.length - 1].reqCount;
    const creepPct      = baselineCount > 0
      ? Math.round(((latestCount - baselineCount) / baselineCount) * 100)
      : 0;

    const verdict =
      creepPct >= 60 ? 'HIGH' :
      creepPct >= 30 ? 'MODERATE' : 'LOW';

    const timeline = snapshots.map((s: { round: number; reqCount: number; createdAt: Date }) => ({
      round:    s.round,
      reqCount: s.reqCount,
      label:    `Rnd ${s.round}`,
      date:     s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      available: true,
      baselineCount,
      latestCount,
      creepPct,
      verdict,
      timeline,
      roundCount: snapshots.length,
    });

  } catch (error: any) {
    console.error('Scope API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
