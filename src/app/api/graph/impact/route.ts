import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildInMemoryGraph,
  traverseDownstream,
  type GraphNodeData,
  type GraphEdgeData,
} from '@/lib/graph';

/**
 * POST /api/graph/impact
 *
 * Accepts a list of changed nodeIds and returns the deterministic downstream
 * impact via BFS graph traversal.
 *
 * Body: { projectId?: string, changedNodeIds: string[], nodes?: GraphNodeData[], edges?: GraphEdgeData[] }
 *
 * - If projectId is provided: loads graph from DB and traverses
 * - If nodes/edges are provided: traverses the in-memory graph directly
 *   (used by the client for unsaved/in-session projects)
 *
 * Response: { affectedNodes, affectedDocTypes, traversalPaths }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    const {
      projectId,
      changedNodeIds,
      nodes: clientNodes,
      edges: clientEdges,
    } = await req.json();

    if (!Array.isArray(changedNodeIds) || changedNodeIds.length === 0) {
      return NextResponse.json(
        { affectedNodes: [], affectedDocTypes: [], traversalPaths: [] },
        { status: 200 }
      );
    }

    let graphNodes: GraphNodeData[] = [];
    let graphEdges: GraphEdgeData[] = [];

    if (projectId && session?.user) {
      // ── Path A: Load from DB (saved project) ─────────────────────────────────
      const dbNodes = await prisma.graphNode.findMany({ where: { projectId } });
      const dbEdges = await prisma.graphEdge.findMany({
        where: { projectId },
        include: { fromNode: true, toNode: true },
      });

      graphNodes = dbNodes.map(n => ({
        nodeId:   n.nodeId,
        nodeType: n.nodeType as GraphNodeData['nodeType'],
        label:    n.label,
      }));

      graphEdges = dbEdges.map(e => ({
        from:         e.fromNode.nodeId,
        to:           e.toNode.nodeId,
        relationship: e.relationship as GraphEdgeData['relationship'],
      }));
    } else if (Array.isArray(clientNodes) && Array.isArray(clientEdges)) {
      // ── Path B: Use client-provided in-memory graph (unsaved session) ─────────
      graphNodes = clientNodes;
      graphEdges = clientEdges;
    } else {
      // No graph data available — return empty (existing behaviour preserved)
      return NextResponse.json(
        { affectedNodes: [], affectedDocTypes: [], traversalPaths: [] },
        { status: 200 }
      );
    }

    // Build in-memory graph and traverse
    const graph  = buildInMemoryGraph(graphNodes, graphEdges);
    const result = traverseDownstream(graph, changedNodeIds);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[GraphImpact] Error:', error);
    // Never crash the caller — return empty impact
    return NextResponse.json(
      { affectedNodes: [], affectedDocTypes: [], traversalPaths: [] },
      { status: 200 }
    );
  }
}
