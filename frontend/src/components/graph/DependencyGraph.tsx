import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import type { Connection, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { api } from '../../lib/api';

interface Task {
  _id: string;
  title: string;
  key: string;
  status: string;
  priority: string;
  type: string;
  storyPoints: number;
  dependencies: { taskId: any; type: string }[];
}

interface DependencyGraphProps {
  tasks: Task[];
  onRefresh: () => void;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ tasks, onRefresh }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Generate nodes and edges from tasks
  useEffect(() => {
    // 1. Generate Nodes
    const generatedNodes = tasks.map((task, idx) => {
      // Pick background colors from our Pastel palette based on status
      let bgColor = '#FAF7F2'; // Cloud Cream (Default/Backlog)
      if (task.status === 'done') bgColor = '#C7D7C4'; // Soft Sage
      else if (task.status === 'in_progress') bgColor = '#E5EEF8'; // Sky Mist
      else if (task.status === 'in_review') bgColor = '#D9D1E8'; // Muted Lavender
      else if (task.status === 'todo') bgColor = '#F5F1EA'; // Soft Bone

      // Layout: Simple grid or radial layout for initial placements
      const row = Math.floor(idx / 3);
      const col = idx % 3;

      return {
        id: task._id,
        type: 'default',
        data: {
          label: (
            <div className="flex flex-col text-left gap-1">
              <div className="flex items-center justify-between text-[9px] font-bold text-graphite">
                <span>{task.key}</span>
                <span className="uppercase">{task.type}</span>
              </div>
              <div className="font-semibold text-xs text-charcoal truncate max-w-[150px]">
                {task.title}
              </div>
              <div className="flex items-center justify-between mt-1 text-[9px] text-slateMuted">
                <span className="capitalize px-1 rounded bg-black/5">{task.status}</span>
                <span>{task.storyPoints || 0} pts</span>
              </div>
            </div>
          ),
        },
        position: { x: col * 260 + 50, y: row * 160 + 50 },
        style: {
          background: bgColor,
          border: '1px solid rgba(207, 197, 230, 0.4)',
          borderRadius: '16px',
          padding: '12px',
          width: 200,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
        },
      };
    });

    // 2. Generate Edges
    const generatedEdges: Edge[] = [];
    tasks.forEach((task) => {
      task.dependencies.forEach((dep) => {
        const targetId = typeof dep.taskId === 'object' && dep.taskId ? dep.taskId._id : dep.taskId;
        if (targetId && tasks.some((t) => t._id === targetId)) {
          // Check if we already registered this relation to avoid double drawing
          const exists = generatedEdges.some(
            (e) => (e.source === task._id && e.target === targetId) || (e.source === targetId && e.target === task._id),
          );

          if (!exists) {
            generatedEdges.push({
              id: `${task._id}-${targetId}`,
              source: task._id,
              target: targetId,
              label: dep.type === 'blocks' ? 'blocks' : dep.type === 'blocked-by' ? 'blocked by' : 'relates',
              type: 'smoothstep',
              style: {
                stroke: dep.type === 'blocks' ? '#EFD7D7' : '#CFC5E6', // rose for blocks, lilac for relates
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
                color: dep.type === 'blocks' ? '#EFD7D7' : '#CFC5E6',
              },
            });
          }
        }
      });
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [tasks, setNodes, setEdges]);

  // Handle Drag-and-Drop linking
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;

      try {
        // Default dependency: Source blocks Target
        await api.post(`/tasks/${params.source}/dependencies`, {
          targetTaskId: params.target,
          type: 'blocks',
        });
        onRefresh();
      } catch (err) {
        console.error('Failed to link tasks', err);
      }
    },
    [onRefresh],
  );

  // Handle Edge deletion on double click
  const onEdgeDoubleClick = useCallback(
    async (_event: React.MouseEvent, edge: Edge) => {
      const parts = edge.id.split('-');
      if (parts.length === 2) {
        if (window.confirm('Delete this dependency link?')) {
          try {
            await api.delete(`/tasks/${parts[0]}/dependencies/${parts[1]}`);
            onRefresh();
          } catch (err) {
            console.error('Failed to delete dependency link', err);
          }
        }
      }
    },
    [onRefresh],
  );

  return (
    <div className="flex-1 h-full bg-[#FAF7F2] rounded-3xl border border-pastel-lilac/30 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 glass-panel px-3 py-1.5 rounded-xl border border-pastel-lilac/25 text-[10px] font-semibold text-graphite flex items-center gap-2 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-pastel-lilac" />
        <span>Drag connections between task nodes to assign dependencies. Double click connection to delete.</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        fitView
      >
        <Background color="#CFC5E6" gap={16} size={1} />
        <Controls className="bg-background border-pastel-lilac/30 rounded-xl" />
        <MiniMap 
          nodeColor={() => '#F5F1EA'} 
          maskColor="rgba(248, 245, 240, 0.6)"
          className="bg-background border-pastel-lilac/30 rounded-xl overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
};
