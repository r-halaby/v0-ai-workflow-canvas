"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Canvas, CanvasVisibility, WorkspaceSettings } from "@/lib/atlas-types";
import { INITIAL_CANVASES, DEFAULT_WORKSPACE_SETTINGS } from "@/lib/atlas-types";

type SidebarFilter = "all" | "favorites" | "workspace" | "private";

interface HomePageProps {
  onOpenCanvas: (canvasId: string) => void;
  workspaceSettings: WorkspaceSettings;
  canvases: Canvas[];
  onCanvasesChange: (canvases: Canvas[]) => void;
}

export function HomePage({ onOpenCanvas, workspaceSettings, canvases, onCanvasesChange }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>("all");
  const [showNewCanvasDialog, setShowNewCanvasDialog] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [newCanvasVisibility, setNewCanvasVisibility] = useState<CanvasVisibility>("workspace");
  const [showSageChat, setShowSageChat] = useState(false);
  const [sageMessage, setSageMessage] = useState("");

  const recentCanvases = useMemo(() => {
    return [...canvases]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [canvases]);

  const favoriteCanvases = useMemo(() => {
    return canvases.filter((c) => c.isFavorite);
  }, [canvases]);

  const filteredCanvases = useMemo(() => {
    let filtered = canvases;

    // Apply sidebar filter
    if (sidebarFilter === "favorites") {
      filtered = filtered.filter((c) => c.isFavorite);
    } else if (sidebarFilter === "workspace") {
      filtered = filtered.filter((c) => c.visibility === "workspace");
    } else if (sidebarFilter === "private") {
      filtered = filtered.filter((c) => c.visibility === "private");
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [canvases, sidebarFilter, searchQuery]);

  const handleCreateCanvas = () => {
    if (!newCanvasName.trim()) return;

    const newCanvas: Canvas = {
      id: `canvas-${Date.now()}`,
      name: newCanvasName.trim(),
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workspaceSettings.members[0],
      isFavorite: false,
      visibility: newCanvasVisibility,
    };

    onCanvasesChange([...canvases, newCanvas]);
    setShowNewCanvasDialog(false);
    setNewCanvasName("");
    onOpenCanvas(newCanvas.id);
  };

  const toggleFavorite = (canvasId: string) => {
    onCanvasesChange(
      canvases.map((c) =>
        c.id === canvasId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Sidebar */}
      <div
        className="w-64 flex flex-col border-r"
        style={{ backgroundColor: "#111111", borderColor: "#222222" }}
      >
        {/* Workspace Header */}
        <div className="p-4 border-b" style={{ borderColor: "#222222" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: "#F0FE00", color: "#121212" }}
            >
              {workspaceSettings.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium text-white truncate"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                {workspaceSettings.name}
              </div>
              <div
                className="text-xs text-gray-500"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                {workspaceSettings.members.length} Member{workspaceSettings.members.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Main Nav */}
          <nav className="space-y-1 mb-6">
            <button
              type="button"
              onClick={() => setSidebarFilter("all")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                sidebarFilter === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              All Canvases
            </button>
            <button
              type="button"
              onClick={() => setSidebarFilter("favorites")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                sidebarFilter === "favorites" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2L11.09 6.26L16 6.97L12.5 10.34L13.18 15.25L9 13.05L4.82 15.25L5.5 10.34L2 6.97L6.91 6.26L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Favorites
            </button>
          </nav>

          {/* Favorites Section */}
          {favoriteCanvases.length > 0 && (
            <div className="mb-6">
              <div
                className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Favorites
              </div>
              <div className="space-y-1">
                {favoriteCanvases.map((canvas) => (
                  <button
                    key={canvas.id}
                    type="button"
                    onClick={() => onOpenCanvas(canvas.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors truncate"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    <span className="truncate">{canvas.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div className="mb-6">
            <div
              className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
Recent Canvases
            </div>
            <div className="space-y-1">
              {recentCanvases.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-600" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                  No canvases yet
                </div>
              ) : (
                recentCanvases.map((canvas) => (
                  <button
                    key={canvas.id}
                    type="button"
                    onClick={() => onOpenCanvas(canvas.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors truncate"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    <span className="truncate">{canvas.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Workspace / Private filters */}
          <div className="mb-6">
            <div
              className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Workspace
            </div>
            <button
              type="button"
              onClick={() => setSidebarFilter("workspace")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                sidebarFilter === "workspace" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              All Workspace
            </button>
          </div>

          <div>
            <div
              className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Private
            </div>
            <button
              type="button"
              onClick={() => setSidebarFilter("private")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                sidebarFilter === "private" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="8" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 8V5C6 3.34315 7.34315 2 9 2C10.6569 2 12 3.34315 12 5V8" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              All Private
            </button>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t" style={{ borderColor: "#222222" }}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 9.75H9.75V15H8.25V9.75H3V8.25H8.25V3H9.75V8.25H15V9.75Z" fill="currentColor"/>
              </svg>
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M14.55 11.25C14.4333 11.5166 14.3979 11.8123 14.4482 12.0992C14.4985 12.3861 14.6323 12.6517 14.8333 12.8625L14.8875 12.9167C15.0489 13.078 15.1768 13.2696 15.2641 13.4804C15.3514 13.6912 15.3964 13.917 15.3964 14.1451C15.3964 14.3731 15.3514 14.5989 15.2641 14.8097C15.1768 15.0205 15.0489 15.2122 14.8875 15.3735C14.7262 15.5349 14.5345 15.6628 14.3237 15.7501C14.1129 15.8374 13.8871 15.8824 13.6591 15.8824C13.431 15.8824 13.2052 15.8374 12.9944 15.7501C12.7836 15.6628 12.5919 15.5349 12.4306 15.3735L12.3764 15.3193C12.1656 15.1183 11.9 14.9846 11.6131 14.9343C11.3262 14.884 11.0305 14.9194 10.764 15.036L10.5 15.1477V16.5C10.5 16.9142 10.1642 17.25 9.75 17.25H8.25C7.83579 17.25 7.5 16.9142 7.5 16.5V15.1477L7.236 15.036C6.96949 14.9194 6.6738 14.884 6.3869 14.9343C6.1 14.9846 5.83436 15.1183 5.62355 15.3193L5.5694 15.3735C5.24609 15.6968 4.80647 15.8787 4.34695 15.8787C3.88744 15.8787 3.44782 15.6968 3.12451 15.3735C2.8012 15.0502 2.61926 14.6106 2.61926 14.1511C2.61926 13.6916 2.8012 13.252 3.12451 12.9287L3.17867 12.8745C3.37964 12.6637 3.5134 12.3981 3.56369 12.1112C3.61397 11.8243 3.57853 11.5286 3.46194 11.262L3.35024 11H2C1.58579 11 1.25 10.6642 1.25 10.25V8.75C1.25 8.33579 1.58579 8 2 8H3.35024L3.46194 7.738C3.57853 7.47149 3.61397 7.1758 3.56369 6.8889C3.5134 6.60201 3.37964 6.33636 3.17867 6.12555L3.12451 6.0714C2.8012 5.74809 2.61926 5.30847 2.61926 4.84895C2.61926 4.38944 2.8012 3.94982 3.12451 3.62651C3.44782 3.3032 3.88744 3.12126 4.34695 3.12126C4.80647 3.12126 5.24609 3.3032 5.5694 3.62651L5.62355 3.68067C5.83436 3.88164 6.1 4.0154 6.3869 4.06569C6.6738 4.11597 6.96949 4.08053 7.236 3.96394L7.5 3.85024V2.5C7.5 2.08579 7.83579 1.75 8.25 1.75H9.75C10.1642 1.75 10.5 2.08579 10.5 2.5V3.85024L10.764 3.96194C11.0305 4.07853 11.3262 4.11397 11.6131 4.06369C11.9 4.0134 12.1656 3.87964 12.3764 3.67867L12.4306 3.62451C12.7539 3.3012 13.1935 3.11926 13.653 3.11926C14.1125 3.11926 14.5522 3.3012 14.8755 3.62451C15.1988 3.94782 15.3807 4.38744 15.3807 4.84695C15.3807 5.30647 15.1988 5.74609 14.8755 6.0694L14.8213 6.12355C14.6203 6.33436 14.4866 6.6 14.4363 6.8869C14.386 7.1738 14.4215 7.46949 14.538 7.736L14.6498 8H16C16.4142 8 16.75 8.33579 16.75 8.75V10.25C16.75 10.6642 16.4142 11 16 11H14.6498L14.538 11.262C14.4215 11.5286 14.386 11.8243 14.4363 12.1112C14.4866 12.3981 14.6203 12.6637 14.8213 12.8745L14.8755 12.9287C15.1988 13.252 15.3807 13.6916 15.3807 14.1511C15.3807 14.6106 15.1988 15.0502 14.8755 15.3735C14.5522 15.6968 14.1125 15.8787 13.653 15.8787C13.1935 15.8787 12.7539 15.6968 12.4306 15.3735L12.3764 15.3193C12.1656 15.1183 11.9 14.9846 11.6131 14.9343C11.3262 14.884 11.0305 14.9194 10.764 15.036L10.5 15.1477V16.5C10.5 16.9142 10.1642 17.25 9.75 17.25H8.25C7.83579 17.25 7.5 16.9142 7.5 16.5V15.1477L7.236 15.036C6.96949 14.9194 6.6738 14.884 6.3869 14.9343C6.1 14.9846 5.83436 15.1183 5.62355 15.3193L5.5694 15.3735C5.24609 15.6968 4.80647 15.8787 4.34695 15.8787C3.88744 15.8787 3.44782 15.6968 3.12451 15.3735C2.8012 15.0502 2.61926 14.6106 2.61926 14.1511C2.61926 13.6916 2.8012 13.252 3.12451 12.9287L3.17867 12.8745C3.37964 12.6637 3.5134 12.3981 3.56369 12.1112C3.61397 11.8243 3.57853 11.5286 3.46194 11.262L14.55 11.25Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 6V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="12" r="0.75" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#222222" }}
        >
          <div
            className="text-lg font-medium text-white"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {sidebarFilter === "all" && "All"}
            {sidebarFilter === "favorites" && "Favorites"}
            {sidebarFilter === "workspace" && "Workspace"}
            {sidebarFilter === "private" && "Private"}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333333",
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              />
            </div>

            {/* Member count */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-400" style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 14C2 11.2386 4.68629 9 8 9C11.3137 9 14 11.2386 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {workspaceSettings.members.length}
            </div>

            {/* Invite */}
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/10"
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333333",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              Invite
            </button>

            {/* New Project */}
            <button
              type="button"
              onClick={() => setShowNewCanvasDialog(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "#F0FE00",
                color: "#121212",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              New canvas
            </button>
          </div>
        </div>

        {/* Chaos Ribbon Module */}
        <div className="px-6 pt-6">
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "#141414", border: "1px solid #222222" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className="text-white font-semibold text-base"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Project Chaos Ribbon
                </h3>
                <p
                  className="text-gray-500 text-sm mt-0.5"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Brand Refresh 2026 • Day 18 of 30
                </p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#4ADE80" }} />
                  <span className="text-xs text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>Smooth</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#FCD34D" }} />
                  <span className="text-xs text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>Minor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#FB923C" }} />
                  <span className="text-xs text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>Moderate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#F87171" }} />
                  <span className="text-xs text-gray-400" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>High</span>
                </div>
              </div>
            </div>

            {/* Timeline Ribbon */}
            <div className="relative mb-3">
              {/* Today marker */}
              <div className="absolute top-0 left-[60%] -translate-x-1/2 -translate-y-full pb-1">
                <div
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: "#333333", color: "#ffffff", fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Today
                </div>
              </div>
              
              {/* Ribbon squares */}
              <div className="flex gap-1 pt-6">
                {/* Week 1 - mostly smooth */}
                {[...Array(7)].map((_, i) => (
                  <div
                    key={`w1-${i}`}
                    className="flex-1 h-8 rounded"
                    style={{ backgroundColor: i < 5 ? "#4ADE80" : i === 5 ? "#FCD34D" : "#FB923C" }}
                  />
                ))}
                {/* Week 2 - mixed */}
                {[...Array(7)].map((_, i) => (
                  <div
                    key={`w2-${i}`}
                    className="flex-1 h-8 rounded relative"
                    style={{ backgroundColor: i < 2 ? "#FCD34D" : i < 4 ? "#FB923C" : i === 4 ? "#F87171" : "#FB923C" }}
                  >
                    {i === 2 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs">$</span>
                    )}
                    {i === 3 && (
                      <svg className="absolute inset-0 m-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4" stroke="#000" strokeWidth="1.5"/>
                        <path d="M6 4V6.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                ))}
                {/* Week 3 - current week with today marker */}
                {[...Array(7)].map((_, i) => (
                  <div
                    key={`w3-${i}`}
                    className={`flex-1 h-8 rounded relative ${i >= 4 ? "opacity-40" : ""}`}
                    style={{ backgroundColor: i < 2 ? "#FB923C" : i === 2 ? "#FCD34D" : i === 3 ? "#4ADE80" : "#FCD34D" }}
                  >
                    {i === 3 && (
                      <svg className="absolute inset-0 m-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6C3 4 5 8 6 6C7 4 9 8 10 6" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                    {i === 4 && (
                      <svg className="absolute inset-0 m-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4" stroke="#000" strokeWidth="1.5"/>
                        <path d="M6 4V6.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                ))}
                {/* Week 4 - future (dimmed) */}
                {[...Array(7)].map((_, i) => (
                  <div
                    key={`w4-${i}`}
                    className="flex-1 h-8 rounded opacity-40"
                    style={{ backgroundColor: i % 2 === 0 ? "#FCD34D" : "#FB923C" }}
                  />
                ))}
              </div>
            </div>

            {/* Week labels */}
            <div className="flex text-xs text-gray-500 mb-4" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              <div className="flex-1">Week 1</div>
              <div className="flex-1 text-center">Week 2</div>
              <div className="flex-1 text-center">Week 3</div>
              <div className="flex-1 text-right">Week 4</div>
            </div>

            {/* Today's Detail Card */}
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="text-xs font-medium text-gray-500 mb-1"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    Today
                  </div>
                  <div
                    className="text-sm text-gray-400 mb-3"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    Moderate disruptions
                  </div>

                  {/* Blocker */}
                  <div className="flex items-start gap-2 mb-3">
                    <svg className="mt-0.5 text-red-400" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
                    </svg>
                    <div>
                      <div
                        className="text-red-400 font-medium text-sm"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Critical Blocker
                      </div>
                      <div
                        className="text-white text-sm mt-0.5"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Stakeholder Approval Delayed - Out of Office
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: "rgba(248, 113, 113, 0.2)", color: "#F87171" }}
                    >
                      Blocker
                    </span>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: "rgba(248, 113, 113, 0.2)", color: "#F87171" }}
                    >
                      High Severity
                    </span>
                  </div>
                </div>

                <div
                  className="text-sm text-gray-400"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Phase Halted
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCanvases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#1a1a1a" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="10" height="10" rx="2" stroke="#444444" strokeWidth="2"/>
                  <rect x="18" y="4" width="10" height="10" rx="2" stroke="#444444" strokeWidth="2"/>
                  <rect x="4" y="18" width="10" height="10" rx="2" stroke="#444444" strokeWidth="2"/>
                  <rect x="18" y="18" width="10" height="10" rx="2" stroke="#444444" strokeWidth="2"/>
                </svg>
              </div>
              <div className="text-white font-medium mb-1" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                No canvases yet
              </div>
              <div className="text-gray-500 text-sm mb-4" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Create your first canvas to get started
              </div>
              <button
                type="button"
                onClick={() => setShowNewCanvasDialog(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "#F0FE00",
                  color: "#121212",
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              >
                New canvas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCanvases.map((canvas) => (
                <div
                  key={canvas.id}
                  className="group rounded-xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-white/20"
                  style={{ backgroundColor: "#1a1a1a" }}
                  onClick={() => onOpenCanvas(canvas.id)}
                >
                  {/* Preview Image */}
                  <div className="aspect-[16/10] overflow-hidden relative">
                    {canvas.previewImage ? (
                      <img
                        src={canvas.previewImage}
                        alt={canvas.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: "#252525" }}
                      >
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="8" y="8" width="14" height="14" rx="2" stroke="#444444" strokeWidth="2"/>
                          <rect x="26" y="8" width="14" height="14" rx="2" stroke="#444444" strokeWidth="2"/>
                          <rect x="8" y="26" width="14" height="14" rx="2" stroke="#444444" strokeWidth="2"/>
                          <rect x="26" y="26" width="14" height="14" rx="2" stroke="#444444" strokeWidth="2"/>
                        </svg>
                      </div>
                    )}
                    {/* Favorite button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(canvas.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg transition-opacity opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 18 18"
                        fill={canvas.isFavorite ? "#F0FE00" : "none"}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 2L11.09 6.26L16 6.97L12.5 10.34L13.18 15.25L9 13.05L4.82 15.25L5.5 10.34L2 6.97L6.91 6.26L9 2Z"
                          stroke={canvas.isFavorite ? "#F0FE00" : "#ffffff"}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div
                      className="text-white font-medium text-sm truncate"
                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                    >
                      {canvas.name}
                    </div>
                    <div
                      className="text-gray-500 text-xs mt-0.5"
                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                    >
                      Edited {formatDate(canvas.updatedAt)} by {canvas.createdBy.name.split(" ")[0]} {canvas.createdBy.name.split(" ")[1]?.charAt(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Canvas Dialog */}
      {showNewCanvasDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowNewCanvasDialog(false)}
          />
          <div
            className="relative w-full max-w-md rounded-xl p-6"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-semibold text-white"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                New Canvas
              </h2>
              <button
                type="button"
                onClick={() => setShowNewCanvasDialog(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs text-gray-500 mb-1.5"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Canvas Name
                </label>
                <input
                  type="text"
                  placeholder="Untitled"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCanvas()}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30"
                  style={{
                    backgroundColor: "#0a0a0a",
                    border: "1px solid #333333",
                    fontFamily: "system-ui, Inter, sans-serif",
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label
                  className="block text-xs text-gray-500 mb-1.5"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Visibility
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCanvasVisibility("workspace")}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newCanvasVisibility === "workspace"
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                    style={{
                      backgroundColor: newCanvasVisibility === "workspace" ? "#333333" : "#0a0a0a",
                      border: "1px solid #333333",
                      fontFamily: "system-ui, Inter, sans-serif",
                    }}
                  >
                    Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCanvasVisibility("private")}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newCanvasVisibility === "private"
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                    style={{
                      backgroundColor: newCanvasVisibility === "private" ? "#333333" : "#0a0a0a",
                      border: "1px solid #333333",
                      fontFamily: "system-ui, Inter, sans-serif",
                    }}
                  >
                    Private
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowNewCanvasDialog(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCanvas}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "#F0FE00",
                  color: "#121212",
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sage AI Bot FAB */}
      <button
        type="button"
        onClick={() => setShowSageChat(!showSageChat)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 z-50"
        style={{
          backgroundColor: "#141414",
          border: "1px solid #2a2a2a",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        }}
      >
        {showSageChat ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="#F0FE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <img src="/sage-logo.svg" alt="Sage" className="w-7 h-7" />
        )}
      </button>

      {/* Sage Chat Panel */}
      {showSageChat && (
        <div
          className="fixed bottom-24 right-6 w-96 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{
            backgroundColor: "#141414",
            border: "1px solid #2a2a2a",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Chat Header */}
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ borderBottom: "1px solid #2a2a2a" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#F0FE00" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L12.09 7.26L18 8L14 12L15.18 18L10 15.27L4.82 18L6 12L2 8L7.91 7.26L10 2Z" fill="#121212"/>
              </svg>
            </div>
            <div>
              <h4
                className="text-white font-semibold text-sm"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Sage
              </h4>
              <p
                className="text-gray-500 text-xs"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                AI Design Assistant
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {/* Welcome message */}
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: "#F0FE00" }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2L12.09 7.26L18 8L14 12L15.18 18L10 15.27L4.82 18L6 12L2 8L7.91 7.26L10 2Z" fill="#121212"/>
                </svg>
              </div>
              <div
                className="flex-1 p-3 rounded-xl rounded-tl-sm"
                style={{ backgroundColor: "#1e1e1e" }}
              >
                <p
                  className="text-sm text-gray-300 leading-relaxed"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Hey! I&apos;m Sage, your AI design assistant. I can help you with:
                </p>
                <ul className="mt-2 space-y-1">
                  <li
                    className="text-sm text-gray-400 flex items-center gap-2"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    <span style={{ color: "#F0FE00" }}>•</span> Organizing your design files
                  </li>
                  <li
                    className="text-sm text-gray-400 flex items-center gap-2"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    <span style={{ color: "#F0FE00" }}>•</span> Finding assets across canvases
                  </li>
                  <li
                    className="text-sm text-gray-400 flex items-center gap-2"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    <span style={{ color: "#F0FE00" }}>•</span> Project status summaries
                  </li>
                  <li
                    className="text-sm text-gray-400 flex items-center gap-2"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    <span style={{ color: "#F0FE00" }}>•</span> Design system suggestions
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div
            className="p-4"
            style={{ borderTop: "1px solid #2a2a2a" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
            >
              <input
                type="text"
                value={sageMessage}
                onChange={(e) => setSageMessage(e.target.value)}
                placeholder="Ask Sage anything..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              />
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: sageMessage.trim() ? "#F0FE00" : "#333333" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9"
                    stroke={sageMessage.trim() ? "#121212" : "#666666"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
