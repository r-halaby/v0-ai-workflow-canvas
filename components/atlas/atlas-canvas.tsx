"use client";

import React, { useCallback, useRef, useMemo, useState, useEffect } from "react";
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

import type { AtlasNode, CanvasComment, WorkspaceMember, FileExtension } from "@/lib/atlas-types";
import { FileNode } from "./file-node";
import { StatusPillNode } from "./status-pill-node";
import { TextNode } from "./text-node";
import { CommentPin, NewCommentInput } from "./comment-pin";
import { AddNodeMenu } from "./add-node-menu";

const nodeTypes: NodeTypes = {
  file: FileNode,
  statusPill: StatusPillNode,
  text: TextNode,
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
  onNodeDoubleClick?: (nodeId: string) => void;
  onFileDrop?: (files: FileList, position: { x: number; y: number }) => void;
  onAddNode?: (extension: FileExtension, position?: { x: number; y: number }, sourceNodeId?: string) => void;
  onAddStatusPill?: (position?: { x: number; y: number }, sourceNodeId?: string) => void;
  onAddTextNode?: (textType: "brief" | "note" | "description", position?: { x: number; y: number }, sourceNodeId?: string) => void;
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
  onNodeDoubleClick,
  onFileDrop,
  onAddNode,
  onAddStatusPill,
  onAddTextNode,
}: AtlasCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [handleMenu, setHandleMenu] = useState<{
    position: { x: number; y: number };
    sourceNodeId: string;
    handlePosition: "left" | "right";
    canvasPosition: { x: number; y: number };
  } | null>(null);
  const connectionStartRef = useRef<{ nodeId: string; handleType: string; position: { x: number; y: number } } | null>(null);
  const isDraggingConnectionRef = useRef(false);
  const reactFlowInstance = useReactFlow();

  // Listen for handle click events from nodes
  useEffect(() => {
    const handleHandleClick = (e: CustomEvent<{ nodeId: string; handleType: string; position: { x: number; y: number } }>) => {
      const { nodeId, handleType, position } = e.detail;
      // Use try-catch since screenToFlowPosition may not be available immediately
      let flowPosition = { x: position.x, y: position.y };
      try {
        flowPosition = reactFlowInstance.screenToFlowPosition(position);
      } catch {
        // Use screen position as fallback
      }
      setHandleMenu({
        position,
        sourceNodeId: nodeId,
        handlePosition: handleType === "source" ? "right" : "left",
        canvasPosition: flowPosition,
      });
    };

    window.addEventListener("atlas:handle-click", handleHandleClick as EventListener);
    return () => {
      window.removeEventListener("atlas:handle-click", handleHandleClick as EventListener);
    };
  }, [reactFlowInstance]);

  // Handle connection start - track where we started
  const handleConnectStart = useCallback((event: MouseEvent | TouchEvent, params: { nodeId: string | null; handleType: string | null }) => {
    if (params.nodeId && params.handleType) {
      const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
      const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
      connectionStartRef.current = {
        nodeId: params.nodeId,
        handleType: params.handleType,
        position: { x: clientX, y: clientY },
      };
      isDraggingConnectionRef.current = false;
    }
  }, []);

  // Handle connection end - check if it was a click or drag
  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: { isValid: boolean }) => {
    const start = connectionStartRef.current;
    if (!start) return;

    const clientX = 'clientX' in event ? event.clientX : event.changedTouches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.changedTouches[0].clientY;

    // Calculate distance moved
    const dx = clientX - start.position.x;
    const dy = clientY - start.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If connection was made successfully, don't show menu
    if (connectionState?.isValid) {
      connectionStartRef.current = null;
      isDraggingConnectionRef.current = false;
      return;
    }

    // If moved less than 20px and no connection was made, treat as click - show add menu
    if (distance < 20) {
      let flowPosition = { x: clientX, y: clientY };
      try {
        flowPosition = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });
      } catch {
        // Use screen position as fallback
      }
      setHandleMenu({
        position: { x: clientX, y: clientY },
        sourceNodeId: start.nodeId,
        handlePosition: start.handleType === "source" ? "right" : "left",
        canvasPosition: flowPosition,
      });
    }

    connectionStartRef.current = null;
    isDraggingConnectionRef.current = false;
  }, [reactFlowInstance]);

  

  // Handle menu callbacks
  const handleMenuAddNode = useCallback((extension: FileExtension) => {
    if (handleMenu && onAddNode) {
      onAddNode(extension, handleMenu.canvasPosition, handleMenu.sourceNodeId);
    }
    setHandleMenu(null);
  }, [handleMenu, onAddNode]);

  const handleMenuAddStatusPill = useCallback(() => {
    if (handleMenu && onAddStatusPill) {
      onAddStatusPill(handleMenu.canvasPosition, handleMenu.sourceNodeId);
    }
    setHandleMenu(null);
  }, [handleMenu, onAddStatusPill]);

  const handleMenuAddTextNode = useCallback((textType: "brief" | "note" | "description") => {
    if (handleMenu && onAddTextNode) {
      onAddTextNode(textType, handleMenu.canvasPosition, handleMenu.sourceNodeId);
    }
    setHandleMenu(null);
  }, [handleMenu, onAddTextNode]);

  // Handle file drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingFiles(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're actually leaving the container
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX <= rect.left ||
        clientX >= rect.right ||
        clientY <= rect.top ||
        clientY >= rect.bottom
      ) {
        setIsDraggingFiles(false);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    if (e.dataTransfer.files.length > 0 && onFileDrop) {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (bounds) {
        const position = {
          x: e.clientX - bounds.left,
          y: e.clientY - bounds.top,
        };
        onFileDrop(e.dataTransfer.files, position);
      }
    }
  }, [onFileDrop]);

  // Apply search highlighting to nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const label = node.data.label || "";
      const fileName = node.data.fileName || "";
      const matchesSearch = !searchQuery || 
        label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fileName.toLowerCase().includes(searchQuery.toLowerCase());

      return {
        ...node,
        draggable: true,
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
      style={{ cursor: commentMode ? "crosshair" : "default" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={filteredNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onPaneClick={handlePaneClick}
        onNodeDoubleClick={(event, node) => {
          // Don't open modal if clicking on a handle
          const target = event.target as HTMLElement;
          if (target.closest(".react-flow__handle")) return;
          
          if (node.type === "file" && onNodeDoubleClick) {
            onNodeDoubleClick(node.id);
          }
        }}
        onDoubleClick={(event) => {
          if (commentMode) return;
          const bounds = reactFlowWrapper.current?.getBoundingClientRect();
          if (!bounds) return;
          const target = event.target as HTMLElement;
          if (target.closest(".react-flow__node")) return;
          const position = {
            x: event.clientX - bounds.left - 110,
            y: event.clientY - bounds.top - 80,
          };
          onDoubleClick(position);
        }}
        onClick={(event) => {
          if (!commentMode) return;
          const bounds = reactFlowWrapper.current?.getBoundingClientRect();
          if (!bounds) return;
          const target = event.target as HTMLElement;
          if (target.closest(".react-flow__node") || target.closest("[data-comment-id]")) return;
          const position = {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          };
          onCanvasClick(position);
        }}
        nodeTypes={nodeTypes}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectionOnDrag={false}
        panOnScroll={false}
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
        panOnDrag={commentMode ? false : [1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
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
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <div className="relative w-full h-full">
          {comments.map((comment) => (
            <div key={comment.id} className="pointer-events-auto" style={{ position: "absolute", left: comment.position.x, top: comment.position.y }}>
              <CommentPin
                comment={comment}
                isSelected={selectedCommentId === comment.id}
                onSelect={() => onCommentSelect(comment.id)}
                onUpdate={onCommentUpdate}
                onDelete={() => onCommentDelete(comment.id)}
                currentUser={currentUser}
              />
            </div>
          ))}

          {/* New comment input */}
          {newCommentPosition && (
            <div className="pointer-events-auto" style={{ position: "absolute", left: newCommentPosition.x, top: newCommentPosition.y }}>
              <NewCommentInput
                position={{ x: 0, y: 0 }}
                onSubmit={(content) => onCommentAdd(content, newCommentPosition)}
                onCancel={onCancelNewComment}
              />
            </div>
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

      {/* File drop overlay */}
      {isDraggingFiles && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          style={{ backgroundColor: "rgba(10, 10, 10, 0.85)" }}
        >
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl"
            style={{ 
              backgroundColor: "#141414", 
              border: "2px dashed #3a3a3a",
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#1f1f1f" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.5">
                <path d="M12 16V4M12 4L8 8M12 4L16 8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Drop files to upload
              </p>
              <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Images, documents, and media files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Handle click menu */}
      {handleMenu && (
        <AddNodeMenu
          onAddNode={handleMenuAddNode}
          onAddStatusPill={handleMenuAddStatusPill}
          onAddTextNode={handleMenuAddTextNode}
          onClose={() => setHandleMenu(null)}
          position={handleMenu.position}
          sourceNodeId={handleMenu.sourceNodeId}
          sourceHandlePosition={handleMenu.handlePosition}
        />
      )}
    </div>
  );
}
