"use client";

import React, { useState, useRef, useEffect } from "react";
import type { FilterState, FileExtension } from "@/lib/atlas-types";

interface AtlasToolbarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onAddNode: (extension: FileExtension) => void;
  onUploadClick: () => void;
  onSettingsClick: () => void;
  canvasName?: string;
  onBack?: () => void;
}

const FILE_TYPE_OPTIONS: { label: string; extension: FileExtension }[] = [
  { label: "Design File", extension: ".fig" },
  { label: "Document", extension: ".pdf" },
  { label: "Video", extension: ".mp4" },
  { label: "Image", extension: ".psd" },
  { label: "Brand Asset", extension: ".ai" },
];

export function AtlasToolbar({ filters, onFiltersChange, onAddNode, onUploadClick, onSettingsClick, canvasName, onBack }: AtlasToolbarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="h-14 flex items-center justify-between px-4"
      style={{
        backgroundColor: "#0d0d0d",
        borderBottom: "1px solid #222222",
      }}
    >
      {/* Left: Logo + Back + Canvas Name */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <img 
          src="/atlas-logo.svg" 
          alt="Atlas" 
          className="h-6"
          style={{ width: "auto" }}
        />
        {canvasName && (
          <>
            <div className="w-px h-5" style={{ backgroundColor: "#333333" }} />
            <span
              className="text-sm text-white font-medium truncate max-w-[200px]"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              {canvasName}
            </span>
          </>
        )}
      </div>

      {/* Center: Controls */}
      <div className="flex items-center gap-3">
        {/* Add node button */}
        <div className="relative" ref={addMenuRef}>
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"
            style={{ backgroundColor: showAddMenu ? "rgba(255,255,255,0.1)" : "transparent" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {showAddMenu && (
            <div
              className="absolute top-full left-0 mt-2 py-1 rounded-lg shadow-lg z-50"
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

        <div className="w-px h-6" style={{ backgroundColor: "#333333" }} />

        {/* Product filter */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: "#1a1a1a" }}>
          {(["all", "atlas", "synthesis", "sage"] as const).map((product) => (
            <button
              key={product}
              type="button"
              onClick={() => onFiltersChange({ ...filters, product })}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                fontFamily: "system-ui, Inter, sans-serif",
                backgroundColor: filters.product === product ? "#333333" : "transparent",
                color: filters.product === product ? "white" : "#888888",
              }}
            >
              {product === "all" ? "All" : product.charAt(0).toUpperCase() + product.slice(1)}
            </button>
          ))}
        </div>

        <div className="w-px h-6" style={{ backgroundColor: "#333333" }} />

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: "#1a1a1a" }}>
          {(["all", "draft", "in-review", "approved"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onFiltersChange({ ...filters, status })}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                fontFamily: "system-ui, Inter, sans-serif",
                backgroundColor: filters.status === status ? "#333333" : "transparent",
                color: filters.status === status ? "white" : "#888888",
              }}
            >
              {status === "all" ? "All" : status === "in-review" ? "In Review" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Upload + Settings buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ 
            backgroundColor: "#F0FE00", 
            color: "#121212",
            fontFamily: "system-ui, Inter, sans-serif",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Upload
        </button>

        <button
          type="button"
          onClick={onSettingsClick}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.55 11.25C14.4333 11.5166 14.3979 11.8123 14.4482 12.0992C14.4985 12.3861 14.6323 12.6517 14.8333 12.8625L14.8875 12.9167C15.0489 13.078 15.1768 13.2696 15.2641 13.4804C15.3514 13.6912 15.3964 13.917 15.3964 14.1451C15.3964 14.3731 15.3514 14.5989 15.2641 14.8097C15.1768 15.0205 15.0489 15.2122 14.8875 15.3735C14.7262 15.5349 14.5345 15.6628 14.3237 15.7501C14.1129 15.8374 13.8871 15.8824 13.6591 15.8824C13.431 15.8824 13.2052 15.8374 12.9944 15.7501C12.7836 15.6628 12.5919 15.5349 12.4306 15.3735L12.3764 15.3193C12.1656 15.1183 11.9 14.9846 11.6131 14.9343C11.3262 14.884 11.0305 14.9194 10.764 15.036C10.5028 15.1469 10.2813 15.3324 10.1267 15.5696C9.97213 15.8068 9.89122 16.0849 9.89396 16.3685V16.5C9.89396 16.9602 9.71117 17.4016 9.38611 17.7267C9.06104 18.0517 8.61962 18.2345 8.15943 18.2345C7.69923 18.2345 7.25781 18.0517 6.93275 17.7267C6.60768 17.4016 6.4249 16.9602 6.4249 16.5V16.431C6.41718 16.1399 6.32742 15.8569 6.16609 15.6174C6.00476 15.3779 5.77869 15.1919 5.51358 15.0819C5.24708 14.9653 4.95139 14.9299 4.66449 14.9802C4.3776 15.0305 4.11196 15.1642 3.90115 15.3652L3.84694 15.4194C3.68563 15.5808 3.49396 15.7087 3.28317 15.796C3.07238 15.8833 2.84656 15.9283 2.61854 15.9283C2.39052 15.9283 2.1647 15.8833 1.95391 15.796C1.74312 15.7087 1.55145 15.5808 1.39014 15.4194C1.22873 15.2581 1.10087 15.0665 1.01356 14.8557C0.926249 14.6449 0.881272 14.4191 0.881272 14.191C0.881272 13.963 0.926249 13.7372 1.01356 13.5264C1.10087 13.3156 1.22873 13.1239 1.39014 12.9626L1.44435 12.9084C1.64533 12.6976 1.77908 12.432 1.82936 12.1451C1.87965 11.8582 1.84422 11.5625 1.72762 11.296C1.61668 11.0348 1.43116 10.8133 1.19399 10.6587C0.956815 10.5041 0.678688 10.4232 0.395077 10.426H0.263687C-0.196508 10.426 -0.637924 10.2432 -0.962992 9.91813C-1.28806 9.59307 -1.47084 9.15165 -1.47084 8.69145C-1.47084 8.23126 -1.28806 7.78984 -0.962992 7.46478C-0.637924 7.13971 -0.196508 6.95693 0.263687 6.95693H0.332774C0.623912 6.94921 0.906917 6.85945 1.14641 6.69812C1.38591 6.53679 1.57186 6.31072 1.68185 6.04561C1.79844 5.77911 1.83388 5.48342 1.78359 5.19652C1.73331 4.90963 1.59955 4.64399 1.39858 4.43318L1.34437 4.37897C1.18296 4.21766 1.0551 4.02599 0.967792 3.8152C0.880482 3.60441 0.835505 3.37859 0.835505 3.15057C0.835505 2.92255 0.880482 2.69673 0.967792 2.48594C1.0551 2.27515 1.18296 2.08348 1.34437 1.92217C1.50568 1.76076 1.69735 1.6329 1.90814 1.54559C2.11893 1.45828 2.34475 1.4133 2.57277 1.4133C2.80079 1.4133 3.02661 1.45828 3.2374 1.54559C3.44819 1.6329 3.63986 1.76076 3.80117 1.92217L3.85538 1.97638C4.06619 2.17735 4.33183 2.31111 4.61872 2.36139C4.90562 2.41168 5.20131 2.37624 5.46781 2.25965H5.51358C5.77479 2.14871 5.99629 1.96319 6.15087 1.72602C6.30546 1.48884 6.38637 1.21072 6.38363 0.927106V0.795716C6.38363 0.335522 6.56641 -0.105894 6.89148 -0.430962C7.21654 -0.75603 7.65796 -0.938812 8.11816 -0.938812C8.57835 -0.938812 9.01977 -0.75603 9.34484 -0.430962C9.6699 -0.105894 9.85269 0.335522 9.85269 0.795716V0.864803C9.84995 1.14842 9.93086 1.42654 10.0854 1.66372C10.24 1.90089 10.4615 2.08641 10.7228 2.19735C10.9893 2.31395 11.285 2.34938 11.5719 2.2991C11.8588 2.24881 12.1244 2.11506 12.3352 1.91408L12.3894 1.85987C12.5507 1.69846 12.7424 1.5706 12.9532 1.48329C13.164 1.39598 13.3898 1.351 13.6178 1.351C13.8459 1.351 14.0717 1.39598 14.2825 1.48329C14.4933 1.5706 14.6849 1.69846 14.8462 1.85987C15.0077 2.02118 15.1355 2.21285 15.2228 2.42364C15.3101 2.63443 15.3551 2.86025 15.3551 3.08827C15.3551 3.31629 15.3101 3.54211 15.2228 3.7529C15.1355 3.96369 15.0077 4.15536 14.8462 4.31667L14.792 4.37088C14.5911 4.58169 14.4573 4.84733 14.407 5.13422C14.3567 5.42112 14.3922 5.71681 14.5088 5.98331V6.02908C14.6197 6.29029 14.8052 6.51179 15.0424 6.66637C15.2796 6.82096 15.5577 6.90187 15.8413 6.89913H15.9727C16.4329 6.89913 16.8743 7.08191 17.1994 7.40698C17.5244 7.73204 17.7072 8.17346 17.7072 8.63366C17.7072 9.09385 17.5244 9.53527 17.1994 9.86034C16.8743 10.1854 16.4329 10.3682 15.9727 10.3682H15.9036C15.62 10.3709 15.3419 10.4518 15.1047 10.6064C14.8675 10.761 14.682 10.9825 14.5711 11.2437L14.55 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
