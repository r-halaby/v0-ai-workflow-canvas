"use client";

import React, { useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FileNodeData, FileExtension, TaskItem, WorkspaceMember } from "@/lib/atlas-types";
import { PRODUCT_COLORS, WORKSPACE_MEMBERS } from "@/lib/atlas-types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

// Inline SVG icons for file types
const FileIcons: Record<FileExtension | "default", React.ReactNode> = {
  ".fig": (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 1C4.11929 1 3 2.11929 3 3.5C3 4.88071 4.11929 6 5.5 6H8V1H5.5Z" fill="#F24E1E"/>
      <path d="M8 1V6H10.5C11.8807 6 13 4.88071 13 3.5C13 2.11929 11.8807 1 10.5 1H8Z" fill="#FF7262"/>
      <path d="M8 6V11H5.5C4.11929 11 3 9.88071 3 8.5C3 7.11929 4.11929 6 5.5 6H8Z" fill="#A259FF"/>
      <path d="M3 13.5C3 12.1193 4.11929 11 5.5 11H8V13.5C8 14.8807 6.88071 16 5.5 16C4.11929 16 3 14.8807 3 13.5Z" fill="#0ACF83"/>
      <path d="M8 6H10.5C11.8807 6 13 7.11929 13 8.5C13 9.88071 11.8807 11 10.5 11C9.11929 11 8 9.88071 8 8.5V6Z" fill="#1ABCFE"/>
    </svg>
  ),
  ".psd": (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#001E36"/>
      <path d="M4 11V5H6.5C7.88071 5 8.5 5.88071 8.5 6.75C8.5 7.61929 7.88071 8.5 6.5 8.5H5.5V11H4ZM5.5 7.25H6.25C6.66421 7.25 7 6.91421 7 6.75C7 6.58579 6.66421 6.25 6.25 6.25H5.5V7.25Z" fill="#31A8FF"/>
      <path d="M9 9.5C9 8.67157 9.67157 8 10.5 8C11.0523 8 11.5 8.22386 11.75 8.5V8H13V11H11.75V10.5C11.5 10.7761 11.0523 11 10.5 11C9.67157 11 9 10.3284 9 9.5ZM10.5 10C10.7761 10 11 9.77614 11 9.5C11 9.22386 10.7761 9 10.5 9C10.2239 9 10 9.22386 10 9.5C10 9.77614 10.2239 10 10.5 10Z" fill="#31A8FF"/>
    </svg>
  ),
  ".pdf": (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF0000"/>
      <path d="M3 11V5H5C5.82843 5 6.5 5.67157 6.5 6.5C6.5 7.32843 5.82843 8 5 8H4V11H3ZM4 7H4.75C5.02614 7 5.25 6.77614 5.25 6.5C5.25 6.22386 5.02614 6 4.75 6H4V7Z" fill="white"/>
      <path d="M7 11V5H8.5C9.88071 5 11 6.11929 11 7.5V8.5C11 9.88071 9.88071 11 8.5 11H7ZM8.25 10H8.5C9.32843 10 10 9.32843 10 8.5V7.5C10 6.67157 9.32843 6 8.5 6H8.25V10Z" fill="white"/>
      <path d="M12 11V5H14V6H13V7.5H14V8.5H13V11H12Z" fill="white"/>
    </svg>
  ),
  ".mp4": (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#7C3AED"/>
      <path d="M6 5L11 8L6 11V5Z" fill="white"/>
    </svg>
  ),
  ".ai": (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF9A00"/>
      <path d="M4 11L5.5 5H7L8.5 11H7.25L7 10H5.5L5.25 11H4ZM5.75 9H6.75L6.25 7L5.75 9Z" fill="#300"/>
      <path d="M9 11V5H10.25V11H9Z" fill="#300"/>
    </svg>
  ),
  ".indd": (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#FF3366"/>
      <path d="M5 11V5H6.25V11H5Z" fill="white"/>
      <path d="M7.5 11V5H9C10.3807 5 11.5 6.11929 11.5 7.5V8.5C11.5 9.88071 10.3807 11 9 11H7.5ZM8.75 10H9C9.82843 10 10.5 9.32843 10.5 8.5V7.5C10.5 6.67157 9.82843 6 9 6H8.75V10Z" fill="white"/>
    </svg>
  ),
  ".pptx": (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3" fill="#D24726"/>
      <path d="M4 11V5H6.5C7.60457 5 8.5 5.89543 8.5 7C8.5 8.10457 7.60457 9 6.5 9H5.25V11H4ZM5.25 8H6.25C6.66421 8 7 7.66421 7 7C7 6.33579 6.66421 6 6.25 6H5.25V8Z" fill="white"/>
      <path d="M9 11V5H10.25V11H9Z" fill="white"/>
    </svg>
  ),
  default: (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2C3 1.44772 3.44772 1 4 1H9L13 5V14C13 14.5523 12.5523 15 12 15H4C3.44772 15 3 14.5523 3 14V2Z" fill="#52525b"/>
      <path d="M9 1L13 5H10C9.44772 5 9 4.55228 9 4V1Z" fill="#71717a"/>
    </svg>
  ),
};

// Status badge colors
const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#374151", text: "#9CA3AF" },
  "in-review": { bg: "#FEF3C7", text: "#92400E" },
  approved: { bg: "#D1FAE5", text: "#065F46" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  "in-review": "In Progress",
  approved: "Approved",
};

interface FileNodeProps extends NodeProps<FileNodeData> {
  data: FileNodeData;
  selected?: boolean;
}

export function FileNode({ data, selected }: FileNodeProps) {
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(data.tasks || []);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

  const productColor = PRODUCT_COLORS[data.product];
  const fileIcon = FileIcons[data.fileExtension] || FileIcons.default;
  const statusStyle = STATUS_BADGE_STYLES[data.status] || STATUS_BADGE_STYLES.draft;
  const statusLabel = STATUS_LABELS[data.status] || "Draft";
  const previewImages = data.previewImages || [];
  const hasImages = previewImages.length > 0;
  const taskCount = tasks.length;

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  }, []);

  const handleAddTask = useCallback(() => {
    if (!newTaskTitle.trim()) return;
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle("");
  }, [newTaskTitle]);

  const handleAssignTask = useCallback((taskId: string, member: WorkspaceMember) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, assignee: member } : t
    ));
    setAssigningTaskId(null);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  return (
    <div
      className="relative group"
      style={{
        width: 220,
        background: "#1C1C1E",
        borderRadius: 16,
        overflow: "visible",
        boxShadow: selected 
          ? `0 0 0 2px ${productColor}, 0 8px 32px rgba(0,0,0,0.4)` 
          : "0 4px 20px rgba(0,0,0,0.3)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ background: "#52525b", borderColor: "#71717a" }}
      />

      {/* Image Preview Grid */}
      <div 
        className="grid grid-cols-2 gap-0.5 p-1"
        style={{ background: "#2C2C2E", borderRadius: "16px 16px 0 0" }}
      >
        {hasImages ? (
          previewImages.slice(0, 4).map((img, i) => (
            <div 
              key={i} 
              className="aspect-square overflow-hidden"
              style={{ borderRadius: i === 0 ? "12px 4px 4px 4px" : i === 1 ? "4px 12px 4px 4px" : i === 2 ? "4px 4px 4px 12px" : "4px 4px 12px 4px" }}
            >
              <img 
                src={img} 
                alt="" 
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          ))
        ) : (
          [0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="aspect-square"
              style={{ 
                borderRadius: i === 0 ? "12px 4px 4px 4px" : i === 1 ? "4px 12px 4px 4px" : i === 2 ? "4px 4px 4px 12px" : "4px 4px 12px 4px",
                background: `linear-gradient(135deg, ${productColor}40 0%, ${productColor}20 100%)`,
              }}
            />
          ))
        )}
      </div>

      {/* Title Row */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">{fileIcon}</div>
          <div className="flex-1 min-w-0">
            <h3 
              className="text-white text-sm font-semibold truncate"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {data.label}
            </h3>
            <p 
              className="text-xs truncate"
              style={{ color: "#8E8E93", fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {data.lastModified}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Row */}
      <div className="px-3 pb-3 flex items-center justify-between">
        {/* Task Button with Popover */}
        <Popover open={isTaskOpen} onOpenChange={setIsTaskOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:bg-white/10"
              style={{ color: "#8E8E93" }}
              onClick={(e) => {
                e.stopPropagation();
                setIsTaskOpen(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M5 7L6.5 8.5L9 5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span 
                className="text-xs font-medium"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {taskCount}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-72 p-0 border-0"
            style={{ 
              background: "#1C1C1E", 
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              borderRadius: 12,
            }}
            side="bottom"
            align="start"
            sideOffset={8}
          >
            {/* Task List Header */}
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "#333" }}>
              <h4 className="text-sm font-semibold text-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                Tasks
              </h4>
            </div>

            {/* Task Items */}
            <div className="max-h-64 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="px-3 py-4 text-center" style={{ color: "#8E8E93" }}>
                  <p className="text-xs">No tasks yet</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="px-3 py-2 flex items-start gap-2 hover:bg-white/5 group/task"
                    style={{ borderBottom: "1px solid #2C2C2E" }}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      className="mt-0.5 border-gray-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p 
                        className={`text-sm ${task.completed ? "line-through text-gray-500" : "text-white"}`}
                        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                      >
                        {task.title}
                      </p>
                      
                      {/* Assignee Row */}
                      <div className="mt-1 relative">
                        {assigningTaskId === task.id ? (
                          <div className="flex flex-wrap gap-1">
                            {WORKSPACE_MEMBERS.map((member) => (
                              <button
                                key={member.id}
                                onClick={() => handleAssignTask(task.id, member)}
                                className="px-2 py-0.5 text-xs rounded-full hover:bg-white/10 transition-colors"
                                style={{ 
                                  background: "#2C2C2E", 
                                  color: "#8E8E93",
                                  fontFamily: "system-ui, -apple-system, sans-serif",
                                }}
                              >
                                {member.initials}
                              </button>
                            ))}
                          </div>
                        ) : task.assignee ? (
                          <button
                            onClick={() => setAssigningTaskId(task.id)}
                            className="flex items-center gap-1.5 text-xs rounded-full px-2 py-0.5 hover:bg-white/10"
                            style={{ 
                              background: "#2C2C2E", 
                              color: "#8E8E93",
                              fontFamily: "system-ui, -apple-system, sans-serif",
                            }}
                          >
                            <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-medium">
                              {task.assignee.initials}
                            </span>
                            {task.assignee.name}
                          </button>
                        ) : (
                          <button
                            onClick={() => setAssigningTaskId(task.id)}
                            className="text-xs hover:text-white transition-colors"
                            style={{ color: "#6B7280", fontFamily: "system-ui, -apple-system, sans-serif" }}
                          >
                            + Assign
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover/task:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                      style={{ color: "#EF4444" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Task Input */}
            <div className="px-3 py-2 border-t" style={{ borderColor: "#333" }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Add a task..."
                  className="flex-1 text-sm bg-transparent text-white placeholder-gray-500 outline-none"
                  style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
                  style={{ color: "#8E8E93" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Badge */}
        <div
          className="px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: statusStyle.bg, 
            color: statusStyle.text,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {statusLabel}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !opacity-0 group-hover:!opacity-100 transition-opacity"
        style={{ background: "#52525b", borderColor: "#71717a" }}
      />
    </div>
  );
}
