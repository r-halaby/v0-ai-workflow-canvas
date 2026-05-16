"use client";

import React from "react";
import type { SageHealthStatus } from "@/lib/atlas-types";
import { HEALTH_STATUS_COLORS } from "@/lib/atlas-types";
import { getHealthLabel } from "@/lib/use-sage";

interface SageHealthIndicatorProps {
  status: SageHealthStatus;
  driftScore?: number;
  showLabel?: boolean;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  onClick?: () => void;
}

/**
 * Compact health indicator for project cards and list views
 */
export function SageHealthIndicator({
  status,
  driftScore,
  showLabel = false,
  showScore = false,
  size = "sm",
  animate = true,
  onClick,
}: SageHealthIndicatorProps) {
  const color = HEALTH_STATUS_COLORS[status];
  
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };
  
  const textSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const content = (
    <div className="flex items-center gap-1.5">
      {/* Health dot */}
      <div
        className={`${sizeClasses[size]} rounded-full ${animate ? "animate-pulse" : ""}`}
        style={{ backgroundColor: color }}
      />
      
      {/* Optional label */}
      {showLabel && (
        <span 
          className={`${textSizes[size]} font-medium`}
          style={{ color, fontFamily: "system-ui, Inter, sans-serif" }}
        >
          {getHealthLabel(status)}
        </span>
      )}
      
      {/* Optional score */}
      {showScore && driftScore !== undefined && (
        <span 
          className={`${textSizes[size]} font-semibold`}
          style={{ color, fontFamily: "system-ui, Inter, sans-serif" }}
        >
          {driftScore}%
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="hover:opacity-80 transition-opacity"
        title={`Project health: ${getHealthLabel(status)}${driftScore !== undefined ? ` (${driftScore}% aligned)` : ""}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div title={`Project health: ${getHealthLabel(status)}${driftScore !== undefined ? ` (${driftScore}% aligned)` : ""}`}>
      {content}
    </div>
  );
}

interface SageHealthBadgeProps {
  status: SageHealthStatus;
  driftScore?: number;
  conflictCount?: number;
  unresolvedCount?: number;
}

/**
 * Expanded health badge with metrics
 */
export function SageHealthBadge({
  status,
  driftScore,
  conflictCount = 0,
  unresolvedCount = 0,
}: SageHealthBadgeProps) {
  const color = HEALTH_STATUS_COLORS[status];

  return (
    <div 
      className="flex items-center gap-3 px-3 py-1.5 rounded-lg"
      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
    >
      {/* Health status */}
      <div className="flex items-center gap-1.5">
        <div 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: color }}
        />
        <span 
          className="text-xs font-medium"
          style={{ color, fontFamily: "system-ui, Inter, sans-serif" }}
        >
          {getHealthLabel(status)}
        </span>
      </div>
      
      {/* Score */}
      {driftScore !== undefined && (
        <span 
          className="text-xs font-semibold"
          style={{ color, fontFamily: "system-ui, Inter, sans-serif" }}
        >
          {driftScore}%
        </span>
      )}
      
      {/* Alerts */}
      <div className="flex items-center gap-2">
        {conflictCount > 0 && (
          <span 
            className="flex items-center gap-1 text-[10px]"
            style={{ color: HEALTH_STATUS_COLORS["critical"], fontFamily: "system-ui, Inter, sans-serif" }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1L15 14H1L8 1z"/>
              <path d="M8 6v3M8 11.5v.5"/>
            </svg>
            {conflictCount}
          </span>
        )}
        
        {unresolvedCount > 0 && (
          <span 
            className="flex items-center gap-1 text-[10px] text-gray-400"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 5v3M8 10.5v.5"/>
            </svg>
            {unresolvedCount}
          </span>
        )}
      </div>
    </div>
  );
}

interface SageHealthProgressProps {
  driftScore: number;
  driftDelta?: number;
  size?: "sm" | "md";
}

/**
 * Progress bar visualization of drift score
 */
export function SageHealthProgress({
  driftScore,
  driftDelta,
  size = "sm",
}: SageHealthProgressProps) {
  const status: SageHealthStatus = 
    driftScore >= 80 ? "healthy" :
    driftScore >= 60 ? "needs-attention" :
    driftScore >= 40 ? "at-risk" : "critical";
  const color = HEALTH_STATUS_COLORS[status];
  
  const heightClass = size === "sm" ? "h-1" : "h-1.5";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span 
          className="text-[10px] text-gray-500"
          style={{ fontFamily: "system-ui, Inter, sans-serif" }}
        >
          Alignment
        </span>
        <div className="flex items-center gap-1">
          {driftDelta !== undefined && driftDelta !== 0 && (
            <span 
              className="text-[10px] font-medium"
              style={{ 
                color: driftDelta > 0 ? HEALTH_STATUS_COLORS["healthy"] : HEALTH_STATUS_COLORS["critical"],
                fontFamily: "system-ui, Inter, sans-serif"
              }}
            >
              {driftDelta > 0 ? "+" : ""}{driftDelta}%
            </span>
          )}
          <span 
            className="text-xs font-semibold"
            style={{ color, fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {driftScore}%
          </span>
        </div>
      </div>
      <div className={`${heightClass} rounded-full bg-white/10 overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500`}
          style={{ width: `${driftScore}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
