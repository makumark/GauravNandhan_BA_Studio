/**
 * Semantic Graph Engine — Option B (PostgreSQL-backed, in-memory traversal)
 *
 * DESIGN PRINCIPLES:
 * 1. traverseDownstream() is a PURE FUNCTION — works in browser React state.
 *    No DB calls, no API calls. $0 cost per traversal.
 * 2. upsertGraph() is SERVER-ONLY and is always fire-and-forget.
 *    It NEVER throws or blocks the main flow.
 * 3. All existing features are unaffected — graph is fully additive.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type GraphNodeType =
  | 'REQUIREMENT'
  | 'SCREEN'
  | 'API'
  | 'TEST_CASE'
  | 'DOCUMENT'
  | 'EPIC'
  | 'FEATURE';

export type GraphRelationship =
  | 'CONTAINS'       // Epic → Feature, Feature → Requirement
  | 'RENDERS_ON'     // Requirement → Screen
  | 'CALLS'          // Requirement/Feature → API
  | 'VERIFIED_BY'    // Requirement → Test Case
  | 'DOCUMENTED_IN'; // Requirement/Feature → Document

export interface GraphNodeData {
  nodeId:   string;        // e.g. "REQ-1", "SCR-04", "TC-12", "BRD"
  nodeType: GraphNodeType;
  label:    string;        // Human-readable
}

export interface GraphEdgeData {
  from:         string;              // nodeId of source
  to:           string;             // nodeId of target
  relationship: GraphRelationship;
}

export interface InMemoryGraph {
  nodes: Map<string, GraphNodeData>;
  // adjacency list: nodeId → list of { targetNodeId, relationship }
  adjacency: Map<string, { targetId: string; relationship: GraphRelationship }[]>;
}

// ── Document Type Mapping ──────────────────────────────────────────────────────
// Maps a graph nodeType to the BA Studio document tabs that are affected.
export const DOC_TYPE_MAP: Record<GraphNodeType, string[]> = {
  REQUIREMENT: ['BRD', 'FRD', 'PRD', 'SRD'],
  SCREEN:      ['Wireframes', 'Prototypes'],
  API:         ['FRD', 'SRD', 'UML Diagrams'],
  TEST_CASE:   ['Test Cases'],
  DOCUMENT:    [], // document nodes don't trigger other documents
  EPIC:        ['BRD', 'PRD', 'Executive Pitch'],
  FEATURE:     ['FRD', 'PRD'],
};

// ── Build In-Memory Graph ──────────────────────────────────────────────────────
/**
 * Converts flat arrays of nodes and edges into an adjacency map for traversal.
 * Runs in the browser — no DB, no cost.
 */
export function buildInMemoryGraph(
  nodes: GraphNodeData[],
  edges: GraphEdgeData[]
): InMemoryGraph {
  const nodeMap = new Map<string, GraphNodeData>();
  const adjacency = new Map<string, { targetId: string; relationship: GraphRelationship }[]>();

  for (const n of nodes) {
    nodeMap.set(n.nodeId, n);
    if (!adjacency.has(n.nodeId)) adjacency.set(n.nodeId, []);
  }

  for (const e of edges) {
    const list = adjacency.get(e.from) ?? [];
    list.push({ targetId: e.to, relationship: e.relationship });
    adjacency.set(e.from, list);
  }

  return { nodes: nodeMap, adjacency };
}

// ── BFS Downstream Traversal ───────────────────────────────────────────────────
/**
 * Given a set of changed nodeIds, performs a BFS to find every downstream
 * artifact that is transitively affected. Returns:
 * - affectedNodes: all downstream GraphNodeData objects
 * - affectedDocTypes: the unique BA Studio document types that must be flagged stale
 * - traversalPaths: human-readable paths for the Timeline UI
 *
 * Pure function — runs in browser, $0 cost.
 */
export interface TraversalResult {
  affectedNodes:    GraphNodeData[];
  affectedDocTypes: string[];
  traversalPaths:   { from: string; to: string; relationship: string }[];
}

export function traverseDownstream(
  graph: InMemoryGraph,
  changedNodeIds: string[]
): TraversalResult {
  const visited   = new Set<string>();
  const queue     = [...changedNodeIds];
  const paths:    { from: string; to: string; relationship: string }[] = [];
  const docTypes  = new Set<string>();

  // Seed visited with the changed nodes themselves
  for (const id of changedNodeIds) visited.add(id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbours = graph.adjacency.get(current) ?? [];

    for (const { targetId, relationship } of neighbours) {
      paths.push({ from: current, to: targetId, relationship });

      const targetNode = graph.nodes.get(targetId);
      if (targetNode) {
        // Collect affected document types from this node's type
        for (const docType of DOC_TYPE_MAP[targetNode.nodeType] ?? []) {
          docTypes.add(docType);
        }
      }

      if (!visited.has(targetId)) {
        visited.add(targetId);
        queue.push(targetId);
      }
    }
  }

  // Remove the seed nodes from affectedNodes (they are the cause, not the effect)
  const changedSet = new Set(changedNodeIds);
  const affectedNodes = Array.from(visited)
    .filter(id => !changedSet.has(id))
    .map(id => graph.nodes.get(id))
    .filter((n): n is GraphNodeData => n !== undefined);

  return {
    affectedNodes,
    affectedDocTypes: Array.from(docTypes),
    traversalPaths: paths,
  };
}

// ── Heuristic Edge Inference ───────────────────────────────────────────────────
/**
 * When the AI returns only a `snapshot` (old behavior) without explicit graphEdges,
 * this function infers edges from common naming patterns in requirement text.
 * This is the backward-compatibility fallback.
 */
export function inferEdgesFromSnapshot(
  nodes: GraphNodeData[]
): GraphEdgeData[] {
  const edges: GraphEdgeData[] = [];

  const reqs    = nodes.filter(n => n.nodeType === 'REQUIREMENT' || n.nodeType === 'FEATURE');
  const screens = nodes.filter(n => n.nodeType === 'SCREEN');
  const apis    = nodes.filter(n => n.nodeType === 'API');
  const tests   = nodes.filter(n => n.nodeType === 'TEST_CASE');
  const docs    = nodes.filter(n => n.nodeType === 'DOCUMENT');

  // Wire every requirement to every screen (broad heuristic — improved by LLM data)
  for (const req of reqs) {
    for (const screen of screens) {
      edges.push({ from: req.nodeId, to: screen.nodeId, relationship: 'RENDERS_ON' });
    }
    for (const api of apis) {
      edges.push({ from: req.nodeId, to: api.nodeId, relationship: 'CALLS' });
    }
    for (const test of tests) {
      edges.push({ from: req.nodeId, to: test.nodeId, relationship: 'VERIFIED_BY' });
    }
    for (const doc of docs) {
      edges.push({ from: req.nodeId, to: doc.nodeId, relationship: 'DOCUMENTED_IN' });
    }
  }

  return edges;
}

// ── Server-Side DB Persistence (fire-and-forget) ──────────────────────────────
/**
 * Idempotently writes nodes and edges to PostgreSQL via Prisma.
 * Called SERVER-SIDE ONLY after analyze API returns graph data.
 * NEVER throws — failure is silently logged so the main flow is unaffected.
 */
export async function upsertGraph(
  projectId: string,
  nodes:     GraphNodeData[],
  edges:     GraphEdgeData[]
): Promise<void> {
  // Dynamic import ensures this never runs in the browser (tree-shaken out)
  const { prisma } = await import('@/lib/prisma');

  try {
    // Upsert all nodes first
    const nodeRecords: { nodeId: string; prismaId: string }[] = [];

    for (const node of nodes) {
      const record = await prisma.graphNode.upsert({
        where:  { projectId_nodeId: { projectId, nodeId: node.nodeId } },
        update: { label: node.label, nodeType: node.nodeType },
        create: { projectId, nodeId: node.nodeId, nodeType: node.nodeType, label: node.label },
      });
      nodeRecords.push({ nodeId: node.nodeId, prismaId: record.id });
    }

    const idMap = new Map(nodeRecords.map(r => [r.nodeId, r.prismaId]));

    // Upsert all edges using the resolved Prisma cuid IDs
    for (const edge of edges) {
      const fromId = idMap.get(edge.from);
      const toId   = idMap.get(edge.to);
      if (!fromId || !toId) continue; // Skip if nodes weren't persisted

      await prisma.graphEdge.upsert({
        where: {
          projectId_fromNodeId_toNodeId_relationship: {
            projectId,
            fromNodeId:   fromId,
            toNodeId:     toId,
            relationship: edge.relationship,
          },
        },
        update: {},
        create: {
          projectId,
          fromNodeId:   fromId,
          toNodeId:     toId,
          relationship: edge.relationship,
        },
      });
    }
  } catch (err) {
    // Graph persistence must NEVER break the main analyze flow
    console.error('[SemanticGraph] upsertGraph failed (non-fatal):', err);
  }
}
