"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { FileNodeData, TextNodeData } from "@/lib/atlas-types";
import Image from "next/image";

interface PresentationViewerProps {
  nodes: Node[];
  presentationEdges: Edge[];
  onClose: () => void;
}

export function PresentationViewer({
  nodes,
  presentationEdges,
  onClose,
}: PresentationViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build ordered sequence from presentation edges
  const orderedNodeIds = React.useMemo(() => {
    if (presentationEdges.length === 0) return [];

    // Find the starting node (a node that is a source but not a target)
    const sources = new Set(presentationEdges.map(e => e.source));
    const targets = new Set(presentationEdges.map(e => e.target));
    
    let startNodeId = "";
    for (const source of sources) {
      if (!targets.has(source)) {
        startNodeId = source;
        break;
      }
    }

    // If no clear start, use the first edge's source
    if (!startNodeId && presentationEdges.length > 0) {
      startNodeId = presentationEdges[0].source;
    }

    // Build the sequence by following edges
    const sequence: string[] = [startNodeId];
    const visited = new Set([startNodeId]);
    let currentId = startNodeId;

    while (true) {
      const nextEdge = presentationEdges.find(e => e.source === currentId && !visited.has(e.target));
      if (!nextEdge) break;
      
      sequence.push(nextEdge.target);
      visited.add(nextEdge.target);
      currentId = nextEdge.target;
    }

    return sequence;
  }, [presentationEdges]);

  const currentNodeId = orderedNodeIds[currentIndex];
  const currentNode = nodes.find(n => n.id === currentNodeId);

  const goNext = useCallback(() => {
    if (currentIndex < orderedNodeIds.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, orderedNodeIds.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose]);

  if (!currentNode || orderedNodeIds.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.95)" }}>
        <div className="text-center">
          <p className="text-white text-lg mb-4">No presentation slides found.</p>
          <p className="text-gray-400 text-sm mb-6">Connect nodes with presentation edges to create a presentation.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#333333" }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Render content based on node type
  const renderNodeContent = () => {
    if (currentNode.type === "file") {
      const fileData = currentNode.data as FileNodeData;
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          {fileData.thumbnail || fileData.uploadedFile?.url ? (
            <div className="relative w-full max-w-6xl h-[70vh]">
              <Image
                src={fileData.thumbnail || fileData.uploadedFile?.url || ""}
                alt={fileData.fileName || "Slide"}
                fill
                className="object-contain rounded-lg"
              />
            </div>
          ) : (
            <div 
              className="w-64 h-64 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <span className="text-4xl text-gray-500">{fileData.fileExtension?.toUpperCase()}</span>
            </div>
          )}
          <span 
            className="mt-4 text-xs font-normal tracking-wide"
            style={{ 
              fontFamily: "system-ui, Inter, sans-serif",
              color: "rgba(255,255,255,0.35)",
              fontStyle: "italic"
            }}
          >
            {fileData.fileName || fileData.label}
          </span>
        </div>
      );
    }

    if (currentNode.type === "text") {
      const textData = currentNode.data as TextNodeData;
      return (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto text-center px-8">
          <h2 className="text-3xl font-semibold text-white mb-6" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            {textData.label}
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            {textData.content}
          </p>
        </div>
      );
    }

    // Default render for other node types
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div 
          className="w-64 h-64 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <span className="text-xl text-gray-400">{currentNode.type}</span>
        </div>
        <h2 className="text-2xl font-medium text-white mt-6" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
          {currentNode.data.label || "Untitled"}
        </h2>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div 
            className="px-3 py-1.5 rounded-full text-sm text-white"
            style={{ backgroundColor: "#1a1a1a", fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {currentIndex + 1} / {orderedNodeIds.length}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="#888888" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-16">
        {renderNodeContent()}
      </div>

      {/* Navigation */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2 px-4">
          {orderedNodeIds.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: index === currentIndex ? "#F0FE00" : "#333333",
                transform: index === currentIndex ? "scale(1.5)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={currentIndex === orderedNodeIds.length - 1}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-6 right-6 text-xs text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
        Use arrow keys or space to navigate
      </div>
    </div>
  );
}
