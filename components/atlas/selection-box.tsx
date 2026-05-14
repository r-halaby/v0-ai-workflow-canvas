"use client";

import React from "react";

interface SelectionBoxProps {
  startPoint: { x: number; y: number };
  currentPoint: { x: number; y: number };
}

export function SelectionBox({ startPoint, currentPoint }: SelectionBoxProps) {
  const left = Math.min(startPoint.x, currentPoint.x);
  const top = Math.min(startPoint.y, currentPoint.y);
  const width = Math.abs(currentPoint.x - startPoint.x);
  const height = Math.abs(currentPoint.y - startPoint.y);

  if (width < 5 && height < 5) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        border: "1px dashed #a855f7",
        borderRadius: 4,
      }}
    />
  );
}
