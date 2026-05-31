"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TraceabilityAlertsProps {
  projectId: string;
  editedNodeId?: string; // If the user is currently editing a specific node
}

export function TraceabilityAlerts({ projectId, editedNodeId }: TraceabilityAlertsProps) {
  const [affectedNodes, setAffectedNodes] = useState<any[]>([]);

  useEffect(() => {
    if (!editedNodeId) return;

    // In a real app, this would hit an API that queries GraphEdge where fromNodeId = editedNodeId
    // For now we mock the response to demonstrate the UI
    const fetchAffected = async () => {
      // Mocked response from our graph API
      setAffectedNodes([
        { id: 'TC-12', type: 'TEST_CASE', label: 'Verify User Login', relationship: 'VERIFIED_BY' }
      ]);
    };
    
    fetchAffected();
  }, [projectId, editedNodeId]);

  if (!editedNodeId || affectedNodes.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 my-4">
      <h4 className="text-amber-400 font-semibold flex items-center gap-2 mb-3 text-sm">
        <AlertTriangle className="w-4 h-4" />
        Traceability Warnings
      </h4>
      <div className="space-y-2">
        {affectedNodes.map(node => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            key={node.id} 
            className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <Link2 className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-400">{node.relationship}</p>
                <p className="text-sm text-slate-200 font-medium">{node.id}: {node.label}</p>
              </div>
            </div>
            <button className="text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-3 py-1.5 rounded transition-colors">
              Review
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
