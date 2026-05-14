"use client";

import React, { useState } from "react";
import type { FileNodeData, FileVersion, FileActivity, TaskItem, WorkspaceMember } from "@/lib/atlas-types";
import { STATUS_COLORS, STATUS_LABELS, WORKSPACE_MEMBERS } from "@/lib/atlas-types";
import { Checkbox } from "@/components/ui/checkbox";

// File type icons (simplified versions)
const FileTypeIcon = ({ extension }: { extension: string }) => {
  const iconColor = {
    ".fig": "#A259FF",
    ".psd": "#31A8FF",
    ".ai": "#FF9A00",
    ".pdf": "#FF0000",
    ".mp4": "#7C3AED",
    ".indd": "#FF3366",
    ".pptx": "#D24726",
  }[extension] || "#666666";

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: iconColor }}
    >
      <span className="text-white text-xs font-bold">
        {extension.replace(".", "").toUpperCase().slice(0, 2)}
      </span>
    </div>
  );
};

interface FileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileData: FileNodeData;
  onUpdateFile?: (updates: Partial<FileNodeData>) => void;
}

export function FileDetailModal({ isOpen, onClose, fileData, onUpdateFile }: FileDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "todos" | "history">("overview");
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (!isOpen) return null;

  // Sample version history if not provided
  const versions: FileVersion[] = fileData.versions || [
    {
      id: "v1",
      versionName: fileData.label,
      previewImages: fileData.previewImages || [
        "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop",
      ],
      uploadedAt: "2026-05-06T10:00:00Z",
      uploadedBy: WORKSPACE_MEMBERS[0],
    },
    {
      id: "v2",
      versionName: `${fileData.label} V 2.0`,
      previewImages: [
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop",
      ],
      uploadedAt: "2026-05-08T14:30:00Z",
      uploadedBy: WORKSPACE_MEMBERS[1],
    },
    {
      id: "v3",
      versionName: `${fileData.label} V 3.0`,
      previewImages: [
        "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=300&fit=crop",
      ],
      uploadedAt: "2026-05-12T09:15:00Z",
      uploadedBy: WORKSPACE_MEMBERS[0],
    },
  ];

  // Sample activity history if not provided
  const activities: FileActivity[] = fileData.activities || [
    {
      id: "a1",
      type: "version-add",
      description: "Uploaded new version V 3.0",
      user: WORKSPACE_MEMBERS[0],
      timestamp: "2026-05-12T09:15:00Z",
    },
    {
      id: "a2",
      type: "status-change",
      description: "Changed status to In Review",
      user: WORKSPACE_MEMBERS[1],
      timestamp: "2026-05-11T16:30:00Z",
    },
    {
      id: "a3",
      type: "comment",
      description: "Added feedback on color palette",
      user: WORKSPACE_MEMBERS[2],
      timestamp: "2026-05-10T11:00:00Z",
    },
    {
      id: "a4",
      type: "task-complete",
      description: "Completed task: Review typography",
      user: WORKSPACE_MEMBERS[0],
      timestamp: "2026-05-09T14:45:00Z",
    },
    {
      id: "a5",
      type: "upload",
      description: "Initial file upload",
      user: WORKSPACE_MEMBERS[0],
      timestamp: "2026-05-06T10:00:00Z",
    },
  ];

  const tasks = fileData.tasks || [];
  const assignees = fileData.assignees || WORKSPACE_MEMBERS.slice(0, 3);
  const dueDate = fileData.dueDate || "May 15th";
  const blockers = fileData.blockers ?? 1;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const handleTaskToggle = (taskId: string) => {
    if (onUpdateFile && fileData.tasks) {
      const updatedTasks = fileData.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      onUpdateFile({ tasks: updatedTasks });
    }
  };

  const getActivityIcon = (type: FileActivity["type"]) => {
    switch (type) {
      case "upload":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V10M8 2L5 5M8 2L11 5M3 12V13H13V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "comment":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V9C14 10.1046 13.1046 11 12 11H5L2 14V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "status-change":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "task-complete":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "version-add":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const visibleVersions = versions.slice(carouselIndex, carouselIndex + 3);
  const canScrollLeft = carouselIndex > 0;
  const canScrollRight = carouselIndex + 3 < versions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: "#141414", border: "1px solid #2a2a2a" }}
      >
        {/* Header buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {/* Download button */}
          <button
            type="button"
            onClick={() => {
              if (fileData.uploadedFile?.url) {
                const link = document.createElement("a");
                link.href = fileData.uploadedFile.url;
                link.download = fileData.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                alert("No file available for download");
              }
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            title="Download file"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 12V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V12" stroke="#888888" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="#888888" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[85vh] p-8">
          {/* Title */}
          <h2
            className="text-2xl font-semibold text-white mb-6"
            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
          >
            {fileData.label}
          </h2>

          {/* Metadata Row */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Status */}
            <div>
              <div className="text-sm text-gray-500 mb-2" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Status
              </div>
              <span
                className="inline-flex px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: STATUS_COLORS[fileData.status] }}
              >
                {STATUS_LABELS[fileData.status]}
              </span>
            </div>

            {/* Due Date */}
            <div>
              <div className="text-sm text-gray-500 mb-2" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Due Date
              </div>
              <div className="flex items-center gap-2 text-gray-300" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 1V3M11 1V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {dueDate}
              </div>
            </div>

            {/* Blockers */}
            <div>
              <div className="text-sm text-gray-500 mb-2" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Blockers
              </div>
              {blockers > 0 ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                  {blockers}
                </span>
              ) : (
                <span className="text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>None</span>
              )}
            </div>

            {/* Team Members */}
            <div>
              <div className="text-sm text-gray-500 mb-2" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                Team Members
              </div>
              <div className="space-y-1.5">
                {assignees.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: member.avatarColor || "#666666" }}
                    >
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-sm text-gray-300" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                      {member.name.split(" ")[0]} {member.name.split(" ")[1]?.[0]}.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: "#1a1a1a" }}>
            {(["overview", "todos", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#2a2a2a] text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                {tab === "overview" ? "Version History" : tab === "todos" ? `To-Dos (${tasks.length})` : "Activity"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div>
              {/* Version History Carousel */}
              <div className="relative">
                {/* Carousel Navigation */}
                {canScrollLeft && (
                  <button
                    type="button"
                    onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M10 4L6 8L10 12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                {canScrollRight && (
                  <button
                    type="button"
                    onClick={() => setCarouselIndex(Math.min(versions.length - 3, carouselIndex + 1))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4L10 8L6 12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}

                {/* Version Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {visibleVersions.map((version) => (
                    <div
                      key={version.id}
                      className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer"
                      style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
                    >
                      {/* Preview Image */}
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img
                          src={version.previewImages[0]}
                          alt={version.versionName}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                      
                      {/* Version Info */}
                      <div className="p-3 flex items-center gap-2">
                        <FileTypeIcon extension={fileData.fileExtension} />
                        <div>
                          <div className="text-sm font-medium text-white" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                            {version.versionName}
                          </div>
                          <div className="text-xs text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                            Updated {formatDate(version.uploadedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carousel Dots */}
                {versions.length > 3 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: Math.ceil(versions.length / 3) }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCarouselIndex(i * 3)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          Math.floor(carouselIndex / 3) === i ? "bg-white" : "bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "todos" && (
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: task.completed ? "#1a1a1a" : "#1f1f1f", 
                      border: "1px solid #2a2a2a" 
                    }}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                      className="data-[state=checked]:bg-[#F0FE00] data-[state=checked]:border-[#F0FE00] data-[state=checked]:text-black border-gray-600"
                    />
                    <span
                      className={`flex-1 text-sm ${task.completed ? "text-gray-500 line-through" : "text-gray-200"}`}
                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                    >
                      {task.title}
                    </span>
                    {task.assignee && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: task.assignee.avatarColor || "#666666" }}
                        title={task.assignee.name}
                      >
                        {task.assignee.name.split(" ").map(n => n[0]).join("")}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                  No tasks added yet
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400"
                      style={{ backgroundColor: "#1a1a1a" }}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-0.5 flex-1 mt-2" style={{ backgroundColor: "#2a2a2a" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: activity.user.avatarColor || "#666666" }}
                      >
                        {activity.user.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-gray-200" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                        {activity.user.name.split(" ")[0]}
                      </span>
                      <span className="text-xs text-gray-500" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 ml-7" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
