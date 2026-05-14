"use client";

import React, { useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { AtlasNode, CanvasComment, WorkspaceMember } from "@/lib/atlas-types";
import { FileNode } from "./file-node";
import { CommentPin, NewCommentInput } from "./comment-pin";

const nodeTypes: NodeTypes = {
  file: FileNode,
};

interface AtlasCanvasProps {
  nodes: AtlasNode[];
  edges: Edge[];
  searchQuery?: string;
  comments: CanvasComment[];
  commentMode: boolean;
  newCommentPosition: { x: number; y: number } | null;
  selectedCommentId: string | null;
  currentUser: WorkspaceMember;
  onNodesChange: OnNodesChange<AtlasNode>;
  onEdgesChange: ReturnType<typeof useEdgesState>[1];
  onConnect: (connection: Connection) => void;
  onNodesUpdate: (nodes: AtlasNode[]) => void;
  onDoubleClick: (position: { x: number; y: number }) => void;
  onCanvasClick: (position: { x: number; y: number }) => void;
  onCommentSelect: (commentId: string | null) => void;
  onCommentAdd: (content: string, position: { x: number; y: number }) => void;
  onCommentUpdate: (comment: CanvasComment) => void;
  onCommentDelete: (commentId: string) => void;
  onCancelNewComment: () => void;
}

export function AtlasCanvas({
  nodes,
  edges,
  searchQuery = "",
  comments,
  commentMode,
  newCommentPosition,
  selectedCommentId,
  currentUser,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodesUpdate,
  onDoubleClick,
  onCanvasClick,
  onCommentSelect,
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
  onCancelNewComment,
}: AtlasCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Apply search highlighting to nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const matchesSearch = !searchQuery || 
        node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.fileName.toLowerCase().includes(searchQuery.toLowerCase());

      return {
        ...node,
        style: {
          ...node.style,
          opacity: matchesSearch ? 1 : 0.2,
          transition: "opacity 0.2s ease",
        },
      };
    });
  }, [nodes, searchQuery]);

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

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      // Check if we clicked on a node or existing comment
      const target = event.target as HTMLElement;
      if (target.closest(".react-flow__node") || target.closest("[data-comment-id]")) {
        return;
      }

      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      if (commentMode) {
        onCanvasClick(position);
      }
    },
    [commentMode, onCanvasClick]
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (commentMode) return; // Don't add nodes in comment mode

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
    [onDoubleClick, commentMode]
  );

  const handlePaneClick = useCallback(() => {
    // Deselect comment when clicking on empty canvas
    if (selectedCommentId && !commentMode) {
      onCommentSelect(null);
    }
  }, [selectedCommentId, commentMode, onCommentSelect]);

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative"
      onClick={handleCanvasClick}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: commentMode ? "crosshair" : "default" }}
    >
      <ReactFlow
        nodes={filteredNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
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
        panOnDrag={!commentMode}
        zoomOnScroll={!commentMode}
        zoomOnPinch={!commentMode}
        zoomOnDoubleClick={false}
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

      {/* Comment Pins Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          {comments.map((comment) => (
            <CommentPin
              key={comment.id}
              comment={comment}
              isSelected={selectedCommentId === comment.id}
              onSelect={() => onCommentSelect(comment.id)}
              onUpdate={onCommentUpdate}
              onDelete={() => onCommentDelete(comment.id)}
              currentUser={currentUser}
            />
          ))}

          {/* New comment input */}
          {newCommentPosition && (
            <NewCommentInput
              position={newCommentPosition}
              onSubmit={(content) => onCommentAdd(content, newCommentPosition)}
              onCancel={onCancelNewComment}
            />
          )}
        </div>
      </div>

      {/* Comment mode overlay hint */}
      {commentMode && !newCommentPosition && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full pointer-events-none"
          style={{ backgroundColor: "rgba(20, 20, 20, 0.9)", border: "1px solid #2a2a2a" }}
        >
          <span
            className="text-sm text-gray-300"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            Click anywhere to add a comment
          </span>
        </div>
      )}
    </div>
  );
}
