"use client";

import React, { useState, useRef, useEffect } from "react";
import type { FileExtension } from "@/lib/atlas-types";

interface CanvasSideToolbarProps {
  onAddNode: (extension: FileExtension) => void;
  onSettingsClick: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

const FILE_TYPE_OPTIONS: { label: string; extension: FileExtension }[] = [
  { label: "Design File", extension: ".fig" },
  { label: "Document", extension: ".pdf" },
  { label: "Video", extension: ".mp4" },
  { label: "Image", extension: ".psd" },
  { label: "Brand Asset", extension: ".ai" },
];

export function CanvasSideToolbar({ onAddNode, onSettingsClick, onSearchChange, searchQuery }: CanvasSideToolbarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
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
    <>
      {/* Side Toolbar */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-xl z-40"
        style={{ backgroundColor: "#141414", border: "1px solid #2a2a2a" }}
      >
        {/* Comment */}
        <button
          type="button"
          onClick={() => setShowCommentPanel(!showCommentPanel)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            showCommentPanel ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
          title="Comments"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5 12.5C17.5 13.0523 17.2893 13.5819 16.9142 13.9749C16.5391 14.3679 16.0304 14.5833 15.5 14.5833H6.16667L2.5 18.3333V5.83333C2.5 5.28105 2.71071 4.75148 3.08579 4.35844C3.46086 3.96539 3.96957 3.75 4.5 3.75H15.5C16.0304 3.75 16.5391 3.96539 16.9142 4.35844C17.2893 4.75148 17.5 5.28105 17.5 5.83333V12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

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
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333", minWidth: 160 }}
            >
              {FILE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.extension}
                  type="button"
                  onClick={() => {
                    onAddNode(option.extension);
                    setShowAddMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  {option.label}
                </button>
              ))}
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
            <path d="M16.1667 12.5C16.0557 12.7513 16.0226 13.0302 16.0716 13.3005C16.1207 13.5708 16.2495 13.8203 16.4417 14.0167L16.4917 14.0667C16.6466 14.2215 16.7695 14.4053 16.8536 14.6076C16.9378 14.8099 16.9814 15.0268 16.9814 15.2458C16.9814 15.4649 16.9378 15.6817 16.8536 15.884C16.7695 16.0863 16.6466 16.2702 16.4917 16.425C16.3369 16.5799 16.153 16.7027 15.9507 16.7869C15.7484 16.8711 15.5316 16.9147 15.3125 16.9147C15.0934 16.9147 14.8766 16.8711 14.6743 16.7869C14.472 16.7027 14.2881 16.5799 14.1333 16.425L14.0833 16.375C13.8869 16.1828 13.6375 16.054 13.3672 16.0049C13.0969 15.9559 12.818 15.989 12.5667 16.1C12.3203 16.2056 12.1124 16.3806 11.9679 16.6033C11.8234 16.826 11.7487 17.0867 11.7533 17.3517V17.5C11.7533 17.942 11.5777 18.366 11.265 18.6785C10.9522 18.9911 10.5283 19.1667 10.0867 19.1667C9.64499 19.1667 9.22107 18.9911 8.90851 18.6785C8.59595 18.366 8.42 17.942 8.42 17.5V17.4083C8.41198 17.1367 8.32938 16.8732 8.18204 16.6467C8.03469 16.4203 7.82875 16.2397 7.58667 16.125C7.33539 16.014 7.05647 15.9809 6.78618 16.0299C6.51589 16.079 6.26648 16.2078 6.07 16.4L6.02 16.45C5.86517 16.6049 5.6813 16.7277 5.47901 16.8119C5.27672 16.8961 5.05989 16.9397 4.84083 16.9397C4.62178 16.9397 4.40495 16.8961 4.20266 16.8119C4.00037 16.7277 3.8165 16.6049 3.66167 16.45C3.50677 16.2952 3.38393 16.1113 3.29974 15.909C3.21554 15.7067 3.17197 15.4899 3.17197 15.2708C3.17197 15.0518 3.21554 14.835 3.29974 14.6327C3.38393 14.4304 3.50677 14.2465 3.66167 14.0917L3.71167 14.0417C3.90388 13.8452 4.03263 13.5958 4.08169 13.3255C4.13075 13.0552 4.09771 12.7763 3.98667 12.525C3.88111 12.2786 3.70612 12.0707 3.48341 11.9262C3.2607 11.7817 2.99999 11.707 2.735 11.7117H2.58333C2.14131 11.7117 1.71738 11.5361 1.40482 11.2235C1.09226 10.911 0.916667 10.487 0.916667 10.0454C0.916667 9.60363 1.09226 9.17971 1.40482 8.86715C1.71738 8.55459 2.14131 8.379 2.58333 8.379H2.675C2.94665 8.37098 3.21016 8.28838 3.43663 8.14104C3.6631 7.99369 3.84368 7.78775 3.95833 7.54567C4.06938 7.29439 4.10241 7.01547 4.05335 6.74518C4.00429 6.47489 3.87554 6.22548 3.68333 6.029L3.63333 5.979C3.47843 5.82417 3.35559 5.6403 3.2714 5.43801C3.1872 5.23572 3.14363 5.01889 3.14363 4.79983C3.14363 4.58078 3.1872 4.36395 3.2714 4.16166C3.35559 3.95937 3.47843 3.7755 3.63333 3.62067C3.78816 3.46577 3.97204 3.34293 4.17433 3.25874C4.37661 3.17454 4.59344 3.13097 4.8125 3.13097C5.03155 3.13097 5.24838 3.17454 5.45067 3.25874C5.65296 3.34293 5.83683 3.46577 5.99167 3.62067L6.04167 3.67067C6.23815 3.86288 6.48756 3.99163 6.75785 4.04069C7.02814 4.08975 7.30706 4.05671 7.55833 3.94567H7.58333C7.82978 3.84011 8.03765 3.66512 8.18218 3.44241C8.3267 3.2197 8.40138 2.95899 8.39667 2.694V2.5C8.39667 2.05797 8.57226 1.63405 8.88482 1.32149C9.19738 1.00893 9.62131 0.833333 10.0633 0.833333C10.5054 0.833333 10.9293 1.00893 11.2418 1.32149C11.5544 1.63405 11.73 2.05797 11.73 2.5V2.59167C11.7253 2.85665 11.8 3.11737 11.9445 3.34008C12.089 3.56279 12.2969 3.73778 12.5433 3.84333C12.7946 3.95438 13.0735 3.98741 13.3438 3.93835C13.6141 3.88929 13.8635 3.76055 14.06 3.56833L14.11 3.51833C14.2648 3.36343 14.4487 3.24059 14.651 3.1564C14.8533 3.0722 15.0701 3.02863 15.2892 3.02863C15.5082 3.02863 15.725 3.0722 15.9273 3.1564C16.1296 3.24059 16.3135 3.36343 16.4683 3.51833C16.6232 3.67317 16.7461 3.85704 16.8303 4.05933C16.9145 4.26161 16.958 4.47844 16.958 4.6975C16.958 4.91655 16.9145 5.13339 16.8303 5.33567C16.7461 5.53796 16.6232 5.72183 16.4683 5.87667L16.4183 5.92667C16.2261 6.12315 16.0974 6.37256 16.0483 6.64285C15.9993 6.91314 16.0323 7.19206 16.1433 7.44333V7.46833C16.2489 7.71478 16.4239 7.92265 16.6466 8.06718C16.8693 8.2117 17.13 8.28638 17.395 8.28167H17.5C17.942 8.28167 18.366 8.45726 18.6785 8.76982C18.9911 9.08238 19.1667 9.50631 19.1667 9.94833C19.1667 10.3904 18.9911 10.8143 18.6785 11.1268C18.366 11.4394 17.942 11.615 17.5 11.615H17.4083C17.1433 11.6197 16.8826 11.6944 16.6599 11.8389C16.4372 11.9835 16.2622 12.1913 16.1567 12.4377V12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Comment Panel */}
      {showCommentPanel && (
        <div
          className="absolute right-20 top-4 w-80 rounded-xl overflow-hidden shadow-2xl z-40"
          style={{ backgroundColor: "#141414", border: "1px solid #2a2a2a" }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid #2a2a2a" }}
          >
            <h3
              className="text-white font-medium text-sm"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Comments
            </h3>
            <button
              type="button"
              onClick={() => setShowCommentPanel(false)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto">
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p
                className="text-gray-500 text-sm"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                No comments yet
              </p>
              <p
                className="text-gray-600 text-xs mt-1"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Click on a node to add a comment
              </p>
            </div>
          </div>
          <div
            className="p-3"
            style={{ borderTop: "1px solid #2a2a2a" }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
            >
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              />
              <button
                type="button"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
