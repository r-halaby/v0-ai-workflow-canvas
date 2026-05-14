"use client";

import React, { useState, useRef, useEffect } from "react";

interface CanvasSideToolbarProps {
  onAddStatusPill: () => void;
  onAddTextNode: (textType: "brief" | "note" | "description") => void;
  onAddSageNode: (sageType: "chatbot" | "overview" | "stakeholder") => void;
  onAddOperationalNode: (opType: "capacity" | "financial" | "projectHealth" | "pipeline" | "teamHealth") => void;
  onSettingsClick: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  commentMode: boolean;
  onCommentModeChange: (enabled: boolean) => void;
  commentCount: number;
}

export function CanvasSideToolbar({
  onAddStatusPill,
  onAddTextNode,
  onAddSageNode,
  onAddOperationalNode,
  onSettingsClick,
  onSearchChange,
  searchQuery,
  commentMode,
  onCommentModeChange,
  commentCount,
}: CanvasSideToolbarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (!searchQuery) {
          setShowSearch(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery]);

  return (
    <div
      className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-xl z-40"
      style={{ backgroundColor: "#141414", border: "1px solid #2a2a2a" }}
    >
      {/* Comment Mode Toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => onCommentModeChange(!commentMode)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            commentMode ? "text-[#121212]" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
          style={{
            backgroundColor: commentMode ? "#F0FE00" : "transparent",
          }}
          title={commentMode ? "Exit comment mode" : "Add comment (click anywhere on canvas)"}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5 12.5C17.5 13.0523 17.2893 13.5819 16.9142 13.9749C16.5391 14.3679 16.0304 14.5833 15.5 14.5833H6.16667L2.5 18.3333V5.83333C2.5 5.28105 2.71071 4.75148 3.08579 4.35844C3.46086 3.96539 3.96957 3.75 4.5 3.75H15.5C16.0304 3.75 16.5391 3.96539 16.9142 4.35844C17.2893 4.75148 17.5 5.28105 17.5 5.83333V12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Comment count badge */}
        {commentCount > 0 && !commentMode && (
          <div
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-medium px-1"
            style={{ backgroundColor: "#F0FE00", color: "#121212" }}
          >
            {commentCount}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative" ref={searchRef}>
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            showSearch ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
          title="Search canvas"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.5 17.5L13.875 13.875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {showSearch && (
          <div
            className="absolute right-full mr-2 top-0 flex items-center rounded-lg overflow-hidden"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search nodes..."
              className="w-48 px-3 py-2 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="px-2 text-gray-500 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px mx-1" style={{ backgroundColor: "#333333" }} />

      {/* Add Node */}
      <div className="relative" ref={addMenuRef}>
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            showAddMenu ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
          title="Add node"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {showAddMenu && (
          <div
            className="absolute right-full mr-2 top-0 py-1 rounded-lg shadow-lg"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333", width: 160 }}
          >
            {/* Text Nodes Section */}
            <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Text
            </div>
            <button
              type="button"
              onClick={() => {
                onAddTextNode("brief");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#3B82F620", color: "#3B82F6" }}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              Creative Brief
            </button>
            <button
              type="button"
              onClick={() => {
                onAddTextNode("note");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F59E0B20", color: "#F59E0B" }}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4H12M2 7H10M2 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              Note
            </button>
            <button
              type="button"
              onClick={() => {
                onAddTextNode("description");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#8B5CF620", color: "#8B5CF6" }}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4H12M2 7H10M2 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              Description
            </button>
            
            {/* Divider */}
            <div className="h-px mx-2 my-1" style={{ backgroundColor: "#333333" }} />
            
            {/* Status Pill Option */}
            <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Elements
            </div>
            <button
              type="button"
              onClick={() => {
                onAddStatusPill();
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-2.5 rounded-full" style={{ backgroundColor: "#e5e5e5" }} />
              Status Pill
            </button>
            
            {/* Divider */}
            <div className="h-px mx-2 my-1" style={{ backgroundColor: "#333333" }} />
            
            {/* Sage Section */}
            <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Sage
            </div>
            <button
              type="button"
              onClick={() => {
                onAddSageNode("chatbot");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F0FE0020", color: "#F0FE00" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              Sage Chat
            </button>
            <button
              type="button"
              onClick={() => {
                onAddSageNode("overview");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F0FE0020", color: "#F0FE00" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M18 17l-5-5-4 4-3-3" />
                </svg>
              </div>
              Overview
            </button>
            <button
              type="button"
              onClick={() => {
                onAddSageNode("stakeholder");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#F0FE0020", color: "#F0FE00" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                </svg>
              </div>
              Stakeholder
            </button>
            
            {/* Divider */}
            <div className="h-px mx-2 my-1" style={{ backgroundColor: "#333333" }} />
            
            {/* Operations Section */}
            <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Operations
            </div>
            <button
              type="button"
              onClick={() => {
                onAddOperationalNode("capacity");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#3b82f620", color: "#3b82f6" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              Capacity
            </button>
            <button
              type="button"
              onClick={() => {
                onAddOperationalNode("financial");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#10b98120", color: "#10b981" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              Financial
            </button>
            <button
              type="button"
              onClick={() => {
                onAddOperationalNode("projectHealth");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#8b5cf620", color: "#8b5cf6" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              Project Health
            </button>
            <button
              type="button"
              onClick={() => {
                onAddOperationalNode("pipeline");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M7 16l4-8 4 4 6-6" />
                </svg>
              </div>
              Pipeline
            </button>
            <button
              type="button"
              onClick={() => {
                onAddOperationalNode("teamHealth");
                setShowAddMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "#ec489920", color: "#ec4899" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              Team Health
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px mx-1" style={{ backgroundColor: "#333333" }} />

      {/* Settings */}
      <button
        type="button"
        onClick={onSettingsClick}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Settings"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.1667 12.5C16.0557 12.7513 16.0226 13.0302 16.0716 13.3005C16.1207 13.5708 16.2495 13.8203 16.4417 14.0167L16.4917 14.0667C16.6466 14.2215 16.7695 14.4053 16.8536 14.6076C16.9378 14.8099 16.9814 15.0268 16.9814 15.2458C16.9814 15.4649 16.9378 15.6817 16.8536 15.884C16.7695 16.0863 16.6466 16.2702 16.4917 16.425C16.3369 16.5799 16.153 16.7027 15.9507 16.7869C15.7484 16.8711 15.5316 16.9147 15.3125 16.9147C15.0934 16.9147 14.8766 16.8711 14.6743 16.7869C14.472 16.7027 14.2881 16.5799 14.1333 16.425L14.0833 16.375C13.8869 16.1828 13.6375 16.054 13.3672 16.0049C13.0969 15.9559 12.818 15.989 12.5667 16.1C12.3203 16.2056 12.1124 16.3806 11.9679 16.6033C11.8234 16.826 11.7487 17.0867 11.7533 17.3517V17.5C11.7533 17.942 11.5777 18.366 11.265 18.6785C10.9522 18.9911 10.5283 19.1667 10.0867 19.1667C9.64499 19.1667 9.22107 18.9911 8.90851 18.6785C8.59595 18.366 8.42 17.942 8.42 17.5V17.4083C8.41198 17.1367 8.32938 16.8732 8.18204 16.6467C8.03469 16.4203 7.82875 16.2397 7.58667 16.125C7.33539 16.014 7.05647 15.9809 6.78618 16.0299C6.51589 16.079 6.26648 16.2078 6.07 16.4L6.02 16.45C5.86517 16.6049 5.6813 16.7277 5.47901 16.8119C5.27672 16.8961 5.05989 16.9397 4.84083 16.9397C4.62178 16.9397 4.40495 16.8961 4.20266 16.8119C4.00037 16.7277 3.8165 16.6049 3.66167 16.45C3.50677 16.2952 3.38393 16.1113 3.29974 15.909C3.21554 15.7067 3.17197 15.4899 3.17197 15.2708C3.17197 15.0518 3.21554 14.835 3.29974 14.6327C3.38393 14.4304 3.50677 14.2465 3.66167 14.0917L3.71167 14.0417C3.90388 13.8452 4.03263 13.5958 4.08169 13.3255C4.13075 13.0552 4.09771 12.7763 3.98667 12.525C3.88111 12.2786 3.70612 12.0707 3.48341 11.9262C3.2607 11.7817 2.99999 11.707 2.735 11.7117H2.58333C2.14131 11.7117 1.71738 11.5361 1.40482 11.2235C1.09226 10.911 0.916667 10.487 0.916667 10.0454C0.916667 9.60363 1.09226 9.17971 1.40482 8.86715C1.71738 8.55459 2.14131 8.379 2.58333 8.379H2.675C2.94665 8.37098 3.21016 8.28838 3.43663 8.14104C3.6631 7.99369 3.84368 7.78775 3.95833 7.54567C4.06938 7.29439 4.10242 7.01547 4.05336 6.74518C4.0043 6.47489 3.87554 6.22548 3.68333 6.029L3.63333 5.979C3.47844 5.82417 3.3556 5.6403 3.2714 5.43801C3.18721 5.23572 3.14363 5.01889 3.14363 4.79983C3.14363 4.58078 3.18721 4.36395 3.2714 4.16166C3.3556 3.95937 3.47844 3.7755 3.63333 3.62067C3.78817 3.46577 3.97203 3.34293 4.17432 3.25874C4.37661 3.17454 4.59345 3.13097 4.8125 3.13097C5.03156 3.13097 5.24839 3.17454 5.45068 3.25874C5.65297 3.34293 5.83683 3.46577 5.99167 3.62067L6.04167 3.67067C6.23815 3.86288 6.48755 3.99163 6.75784 4.04069C7.02814 4.08975 7.30706 4.05671 7.55833 3.94567H7.58333C7.82974 3.84011 8.03766 3.66512 8.18216 3.44241C8.32666 3.2197 8.40135 2.95899 8.39667 2.694V2.5C8.39667 2.05797 8.57226 1.63405 8.88482 1.32149C9.19738 1.00893 9.62131 0.833334 10.0633 0.833334C10.5054 0.833334 10.9293 1.00893 11.2418 1.32149C11.5544 1.63405 11.73 2.05797 11.73 2.5V2.59167C11.7253 2.85666 11.8 3.11736 11.9445 3.34007C12.089 3.56278 12.2969 3.73778 12.5433 3.84333C12.7946 3.95438 13.0735 3.98742 13.3438 3.93836C13.6141 3.8893 13.8635 3.76054 14.06 3.56833L14.11 3.51833C14.2648 3.36344 14.4487 3.2406 14.651 3.1564C14.8533 3.07221 15.0701 3.02863 15.2892 3.02863C15.5082 3.02863 15.725 3.07221 15.9273 3.1564C16.1296 3.2406 16.3135 3.36344 16.4683 3.51833C16.6232 3.67317 16.7461 3.85703 16.8303 4.05932C16.9145 4.26161 16.958 4.47845 16.958 4.6975C16.958 4.91656 16.9145 5.13339 16.8303 5.33568C16.7461 5.53797 16.6232 5.72183 16.4683 5.87667L16.4183 5.92667C16.2261 6.12315 16.0974 6.37255 16.0483 6.64284C15.9993 6.91314 16.0323 7.19206 16.1433 7.44333V7.46833C16.2489 7.71474 16.4239 7.92266 16.6466 8.06716C16.8693 8.21166 17.13 8.28635 17.395 8.28167H17.5C17.942 8.28167 18.366 8.45726 18.6785 8.76982C18.9911 9.08238 19.1667 9.50631 19.1667 9.94833C19.1667 10.3904 18.9911 10.8143 18.6785 11.1268C18.366 11.4394 17.942 11.615 17.5 11.615H17.4083C17.1434 11.6197 16.8827 11.6944 16.66 11.8389C16.4372 11.9834 16.2622 12.1913 16.1567 12.4377L16.1667 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Comment mode indicator */}
      {commentMode && (
        <div
          className="absolute -left-36 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap"
          style={{ backgroundColor: "#F0FE00", color: "#121212" }}
        >
          <span className="text-xs font-medium" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            Click to comment
          </span>
        </div>
      )}
    </div>
  );
}
