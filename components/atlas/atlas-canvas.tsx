"use client";

import React, { useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { AtlasNode, FilterState, FileExtension } from "@/lib/atlas-types";
import { FileNode } from "./file-node";

const nodeTypes: NodeTypes = {
  file: FileNode,
};

interface AtlasCanvasProps {
  nodes: AtlasNode[];
  edges: Edge[];
  filters: FilterState;
  onNodesChange: OnNodesChange<AtlasNode>;
  onEdgesChange: ReturnType<typeof useEdgesState>[1];
  onConnect: (connection: Connection) => void;
  onNodesUpdate: (nodes: AtlasNode[]) => void;
  onDoubleClick: (position: { x: number; y: number }) => void;
}

export function AtlasCanvas({
  nodes,
  edges,
  filters,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodesUpdate,
  onDoubleClick,
}: AtlasCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Apply filter opacity to nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const matchesProduct = filters.product === "all" || node.data.product === filters.product;
      const matchesStatus = filters.status === "all" || node.data.status === filters.status;
      const isVisible = matchesProduct && matchesStatus;

      return {
        ...node,
        style: {
          ...node.style,
          opacity: isVisible ? 1 : 0.2,
          transition: "opacity 0.2s ease",
        },
      };
    });
  }, [nodes, filters]);

  // Style edges with dashed animation
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        strokeWidth: 2,
        stroke: "#52525b",
        strokeDasharray: "5 5",
      },
      animated: true,
    }));
  }, [edges]);

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      // Check if we clicked on the background (not a node)
      const target = event.target as HTMLElement;
      if (target.closest(".react-flow__node")) return;

      const position = {
        x: event.clientX - bounds.left - 110,
        y: event.clientY - bounds.top - 80,
      };

      onDoubleClick(position);
    },
    [onDoubleClick]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full" onDoubleClick={handleDoubleClick}>
      <ReactFlow
        nodes={filteredNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 0.85,
        }}
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: "default",
          style: { strokeWidth: 2, stroke: "#52525b", strokeDasharray: "5 5" },
          animated: true,
        }}
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#27272a"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor="#3f3f46"
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{
            backgroundColor: "#111111",
            border: "1px solid #222222",
            borderRadius: 8,
          }}
        />
      </ReactFlow>
    </div>
  );
}
