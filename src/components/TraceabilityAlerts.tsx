"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GraphNodeData, GraphEdgeData } from '@/lib/graph';

interface TraceabilityAlertsProps {
  projectId: string;
  editedNodeId?: string; // If the user is currently editing a specific node
  graphNodes?: GraphNodeData[];
  graphEdges?: GraphEdgeData[];
}

export function TraceabilityAlerts({ projectId, editedNodeId, graphNodes = [], graphEdges = [] }: TraceabilityAlertsProps) {
  const [affectedNodes, setAffectedNodes] = useState<any[]>([]);

  useEffect(() => {
    if (!editedNodeId) {
      setAffectedNodes([]);
      return;
    }

    const directImpacts = graphEdges.filter(edge => edge.from === editedNodeId);
    
    const impactsWithData = directImpacts.map(edge => {
      const targetNode = graphNodes.find(n => n.nodeId === edge.to);
      return {
        id: edge.to,
        type: targetNode?.nodeType || 'UNKNOWN',
        label: targetNode?.label || 'Unknown Artifact',
        relationship: edge.relationship
      };
    });

    setAffectedNodes(impactsWithData);
  }, [editedNodeId, graphNodes, graphEdges]);

  if (!editedNodeId || affectedNodes.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 my-4 shadow-lg shadow-amber-500/5 backdrop-blur-sm"
    >
      <h4 className="text-amber-400 font-bold flex items-center gap-2 mb-3 text-sm">
        <AlertTriangle className="w-4 h-4" />
        Traceability Warnings (Live Graph)
      </h4>
      <div className="space-y-2">
        {affectedNodes.map(node => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            key={node.id} 
            className="flex items-center justify-between bg-slate-900/80 p-3 rounded-lg border border-amber-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-md">
                <Link2 className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-amber-500/80 uppercase tracking-wider font-bold mb-0.5">{node.relationship}</p>
                <p className="text-sm text-slate-200 font-medium">{node.id}: <span className="text-slate-400 font-normal">{node.label}</span></p>
                <p className="text-[10px] text-amber-400 mt-1 italic">Warning: This {node.type.toLowerCase().replace('_', ' ')} may now be outdated!</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
