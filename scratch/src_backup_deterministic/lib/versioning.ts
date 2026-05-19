/**
 * Sovereign Requirement Versioning Engine
 * This library is responsible for comparing different versions of project requirements.
 * It identifies additions, modifications, and deletions without touching the core UI.
 */

export interface RequirementNode {
  id: string;
  text: string;
  status: 'CONFIRMED' | 'PROPOSED';
}

export interface Snapshot {
  timestamp: string;
  requirements: RequirementNode[];
  domain: string;
}

export interface DeltaReport {
  added: RequirementNode[];
  modified: { old: RequirementNode; updated: RequirementNode }[];
  removed: RequirementNode[];
  impactScore: number;
  architecturalConflict: string | null;
}

export function calculateDelta(baseline: RequirementNode[], current: RequirementNode[], oldDomain: string, newDomain: string): DeltaReport {
  const added: RequirementNode[] = [];
  const modified: { old: RequirementNode; updated: RequirementNode }[] = [];
  const removed: RequirementNode[] = [];

  const baselineMap = new Map(baseline.map(r => [r.id, r]));
  const currentMap = new Map(current.map(r => [r.id, r]));

  for (const [id, req] of currentMap) {
    const baseReq = baselineMap.get(id);
    if (!baseReq) {
      added.push(req);
    } else if (baseReq.text !== req.text || baseReq.status !== req.status) {
      modified.push({ old: baseReq, updated: req });
    }
  }

  for (const [id, req] of baselineMap) {
    if (!currentMap.has(id)) {
      removed.push(req);
    }
  }

  const changeCount = added.length + modified.length + removed.length;
  const impactScore = Math.min(10, Math.ceil((changeCount / (baseline.length || 1)) * 10));

  let architecturalConflict = null;
  if (oldDomain !== newDomain && oldDomain !== 'General') {
    architecturalConflict = `Domain Shift: Project was ${oldDomain}, now appearing as ${newDomain}.`;
  }

  return { added, modified, removed, impactScore, architecturalConflict };
}
