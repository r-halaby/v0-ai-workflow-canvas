"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { Canvas, CanvasVisibility, WorkspaceSettings, AtlasNode, CanvasTemplate, TemplateCategory, Project } from "@/lib/atlas-types";
import { WorkspaceSettingsDialog } from "./workspace-settings";
import { INITIAL_CANVASES, DEFAULT_WORKSPACE_SETTINGS, PRODUCT_COLORS, SAMPLE_TEMPLATES, TEMPLATE_CATEGORIES, PROJECT_COLORS } from "@/lib/atlas-types";
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, ReactFlowProvider } from "@xyflow/react";
import { FileNode } from "./file-node";
import "@xyflow/react/dist/style.css";

type SidebarFilter = "all" | "favorites" | "workspace" | "private";
type HomeView = "home" | "canvases" | "favorites" | "community" | "workspace-canvas";
type CanvasSubView = "canvases" | "files";

const nodeTypes = { fileNode: FileNode };

interface WorkspaceCanvasViewProps {
  nodes: AtlasNode[];
  groups: { canvasId: string; canvasName: string; startX: number; nodeCount: number }[];
  onOpenCanvas: (canvasId: string) => void;
}

function WorkspaceCanvasView({ nodes, groups, onOpenCanvas }: WorkspaceCanvasViewProps) {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  
  return (
    <div className="w-full h-full" style={{ backgroundColor: "#0A0A0A" }}>
      <ReactFlow
        nodes={flowNodes}
        edges={[]}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 50, y: 50, zoom: 0.6 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1a1a1a" gap={20} />
        <Controls 
          className="!bg-[#1a1a1a] !border-[#2a2a2a] !rounded-lg"
          style={{ button: { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" } }}
        />
        
        {/* Canvas Group Labels */}
        {groups.map((group) => (
          <div
            key={group.canvasId}
            className="absolute"
            style={{
              left: group.startX,
              top: 0,
              transform: "translateY(-10px)",
              pointerEvents: "auto",
            }}
          >
            <button
              type="button"
              onClick={() => onOpenCanvas(group.canvasId)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                color: "#ffffff",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              {group.canvasName}
              <span className="ml-2 text-gray-500">({group.nodeCount})</span>
            </button>
          </div>
        ))}
      </ReactFlow>
      
      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="10" height="10" rx="2" stroke="#666666" strokeWidth="2"/>
                <rect x="18" y="4" width="10" height="10" rx="2" stroke="#666666" strokeWidth="2"/>
                <rect x="4" y="18" width="10" height="10" rx="2" stroke="#666666" strokeWidth="2"/>
                <rect x="18" y="18" width="10" height="10" rx="2" stroke="#666666" strokeWidth="2"/>
              </svg>
            </div>
            <p
              className="text-gray-500 text-sm"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              No workspace canvases with files yet
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function UserSection() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="p-3 border-t" style={{ borderColor: "#222222" }}>
        <div className="animate-pulse h-10 bg-white/5 rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-3 border-t" style={{ borderColor: "#222222" }}>
        <Link
          href="/auth/login"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: "#F0FE00", color: "#121212", fontFamily: "system-ui, Inter, sans-serif" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 border-t" style={{ borderColor: "#222222" }}>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ backgroundColor: "#F0FE00", color: "#121212" }}
        >
          {user.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            {user.user_metadata?.display_name || user.email?.split("@")[0]}
          </div>
          <div className="text-xs text-gray-500 truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
            {user.email}
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/auth/login");
          }}
          className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          title="Sign out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface HomePageProps {
  onOpenCanvas: (canvasId: string) => void;
  workspaceSettings: WorkspaceSettings;
  onWorkspaceSettingsChange: (settings: WorkspaceSettings) => void;
  canvases: Canvas[];
  onCanvasesChange: (canvases: Canvas[]) => void;
}

export function HomePage({ onOpenCanvas, workspaceSettings, onWorkspaceSettingsChange, canvases, onCanvasesChange }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>("all");
  const [activeView, setActiveView] = useState<HomeView>("home");
  const [canvasSubView, setCanvasSubView] = useState<CanvasSubView>("canvases");
  const [showNewCanvasDialog, setShowNewCanvasDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [newCanvasVisibility, setNewCanvasVisibility] = useState<CanvasVisibility>("workspace");
  const [newCanvasProjectId, setNewCanvasProjectId] = useState<string | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedFilesProjects, setExpandedFilesProjects] = useState<Set<string>>(new Set());
  const [expandedFilesCanvases, setExpandedFilesCanvases] = useState<Set<string>>(new Set());
  const [showSageChat, setShowSageChat] = useState(false);
  const [sageMessage, setSageMessage] = useState("");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<"general" | "members" | "products" | "conventions">("general");
  const [templates, setTemplates] = useState<CanvasTemplate[]>(SAMPLE_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [viewingTemplate, setViewingTemplate] = useState<CanvasTemplate | null>(null);
  const currentUserId = workspaceSettings.members[0]?.id || "user-1";

  // Combine all workspace nodes with canvas grouping
  const workspaceNodesData = useMemo(() => {
    const workspaceCanvases = canvases.filter(c => c.visibility === "workspace");
    const allNodes: AtlasNode[] = [];
    const canvasGroups: { canvasId: string; canvasName: string; startX: number; nodeCount: number }[] = [];
    
    let currentX = 0;
    const groupSpacing = 400;
    const nodeSpacing = 280;
    
    workspaceCanvases.forEach((canvas) => {
      if (canvas.nodes.length === 0) return;
      
      const startX = currentX;
      canvasGroups.push({
        canvasId: canvas.id,
        canvasName: canvas.name,
        startX,
        nodeCount: canvas.nodes.length,
      });
      
      canvas.nodes.forEach((node, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        allNodes.push({
          ...node,
          id: `${canvas.id}-${node.id}`,
          position: {
            x: startX + col * nodeSpacing,
            y: row * 260 + 60,
          },
          data: {
            ...node.data,
            canvasName: canvas.name,
          },
        });
      });
      
      const rows = Math.ceil(canvas.nodes.length / 3);
      currentX += Math.min(canvas.nodes.length, 3) * nodeSpacing + groupSpacing;
    });
    
    return { nodes: allNodes, groups: canvasGroups };
  }, [canvases]);

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

    // Apply view/sidebar filter
    if (activeView === "favorites" || sidebarFilter === "favorites") {
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
  }, [canvases, sidebarFilter, searchQuery, activeView]);

  const handleCreateCanvas = () => {
    if (!newCanvasName.trim()) return;

    const newCanvas: Canvas = {
      id: `canvas-${Date.now()}`,
      name: newCanvasName.trim(),
      projectId: newCanvasProjectId,
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
    setNewCanvasProjectId(undefined);
    onOpenCanvas(newCanvas.id);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: newProjectName.trim(),
      color: newProjectColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workspaceSettings.members[0],
      isExpanded: true,
    };

    setProjects([...projects, newProject]);
    setShowNewProjectDialog(false);
    setNewProjectName("");
    setNewProjectColor(PROJECT_COLORS[0]);
  };

  const toggleProjectExpanded = (projectId: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, isExpanded: !p.isExpanded } : p
    ));
  };

  const getProjectCanvases = (projectId: string) => {
    return canvases.filter(c => c.projectId === projectId);
  };

  const getUngroupedCanvases = () => {
    return canvases.filter(c => !c.projectId);
  };

  const toggleFilesProjectExpanded = (projectId: string) => {
    setExpandedFilesProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleFilesCanvasExpanded = (canvasId: string) => {
    setExpandedFilesCanvases(prev => {
      const next = new Set(prev);
      if (next.has(canvasId)) {
        next.delete(canvasId);
      } else {
        next.add(canvasId);
      }
      return next;
    });
  };

  const getCanvasFiles = (canvas: Canvas) => {
    return canvas.nodes.filter(node => node.type === "file");
  };

  const toggleFavorite = (canvasId: string) => {
    onCanvasesChange(
      canvases.map((c) =>
        c.id === canvasId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
  };

  const [canvasToDelete, setCanvasToDelete] = useState<string | null>(null);
  
const deleteCanvas = (canvasId: string) => {
    onCanvasesChange(canvases.filter((c) => c.id !== canvasId));
    setCanvasToDelete(null);
  };

  const handleUpvoteTemplate = (templateId: string) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const hasUpvoted = t.upvotedBy.includes(currentUserId);
      return {
        ...t,
        upvotes: hasUpvoted ? t.upvotes - 1 : t.upvotes + 1,
        upvotedBy: hasUpvoted 
          ? t.upvotedBy.filter(id => id !== currentUserId)
          : [...t.upvotedBy, currentUserId],
      };
    }));
  };

  const handleOpenTemplate = (template: CanvasTemplate) => {
    setViewingTemplate(template);
  };

  const handleDuplicateTemplate = (template: CanvasTemplate) => {
    // Create a new canvas from the template
    const newCanvas: Canvas = {
      id: `canvas-${Date.now()}`,
      name: `${template.name} (Copy)`,
      description: template.description,
      previewImage: template.previewImage,
      nodes: template.nodes,
      edges: template.edges,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workspaceSettings.members[0],
      isFavorite: false,
      visibility: "workspace",
    };
    onCanvasesChange([...canvases, newCanvas]);
    // Increment download count
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, downloads: t.downloads + 1 } : t
    ));
    setViewingTemplate(null);
    onOpenCanvas(newCanvas.id);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return t.name.toLowerCase().includes(query) || 
               t.description.toLowerCase().includes(query) ||
               t.tags.some(tag => tag.includes(query));
      }
      return true;
    }).sort((a, b) => b.upvotes - a.upvotes);
  }, [templates, selectedCategory, searchQuery]);
  
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
              onClick={() => setActiveView("home")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === "home" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.25 6.75L9 2.25L15.75 6.75V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.75 15.75V9H11.25V15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </button>
            <button
              type="button"
              onClick={() => { setSidebarFilter("all"); setActiveView("canvases"); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === "canvases" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
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
              onClick={() => { setSidebarFilter("favorites"); setActiveView("favorites"); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === "favorites" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2L11.09 6.26L16 6.97L12.5 10.34L13.18 15.25L9 13.05L4.82 15.25L5.5 10.34L2 6.97L6.91 6.26L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Favorites
            </button>
            <button
              type="button"
              onClick={() => setActiveView("community")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === "community" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="14" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 9C11.5 9 13 10.5 13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 9C6.5 9 5 10.5 5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Community
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

          {/* Projects Section */}
          {projects.length > 0 && (
            <div className="mb-6">
              <div
                className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Projects
              </div>
              <div className="space-y-1">
                {projects.map((project) => (
                  <div key={project.id}>
                    <button
                      type="button"
                      onClick={() => toggleProjectExpanded(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                    >
                      <svg 
                        width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
                        className={`transition-transform ${project.isExpanded ? "rotate-90" : ""}`}
                      >
                        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate flex-1 text-left">{project.name}</span>
                      <span className="text-xs text-gray-600">{getProjectCanvases(project.id).length}</span>
                    </button>
                    {project.isExpanded && (
                      <div className="ml-4 space-y-0.5">
                        {getProjectCanvases(project.id).map((canvas) => (
                          <button
                            key={canvas.id}
                            type="button"
                            onClick={() => onOpenCanvas(canvas.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors truncate"
                            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                          >
                            <span className="truncate">{canvas.name}</span>
                          </button>
                        ))}
                        {getProjectCanvases(project.id).length === 0 && (
                          <div className="px-3 py-1.5 text-xs text-gray-600" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                            No canvases
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Canvases */}
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
              onClick={() => { setSidebarFilter("workspace"); setActiveView("workspace-canvas"); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === "workspace-canvas" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <ellipse cx="9" cy="9" rx="3" ry="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 9H16" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3.5 5H14.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3.5 13H14.5" stroke="currentColor" strokeWidth="1.5"/>
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

        {/* User Section */}
        <UserSection />
        
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
                <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
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
            {activeView === "home" && "Home"}
            {activeView === "canvases" && "All Canvases"}
            {activeView === "favorites" && "Favorites"}
            {activeView === "community" && "Community"}
            {activeView === "workspace-canvas" && "All Workspace"}
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
            <button
              type="button"
              onClick={() => {
                setSettingsInitialTab("members");
                setShowSettingsDialog(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 14C2 11.2386 4.68629 9 8 9C11.3137 9 14 11.2386 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {workspaceSettings.members.length}
            </button>

            {/* Invite */}
            <button
              type="button"
              onClick={() => {
                setSettingsInitialTab("members");
                setShowSettingsDialog(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/10"
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333333",
                fontFamily: "system-ui, Inter, sans-serif",
              }}
            >
              Invite
            </button>

            {/* Create New Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[#121212] transition-colors hover:opacity-90"
                style={{ backgroundColor: "#F0FE00" }}
                title="Create new"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Create Dropdown */}
              {showCreateMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCreateMenu(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 py-2 rounded-xl shadow-xl z-50 min-w-[200px]"
                    style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateMenu(false);
                        setShowNewProjectDialog(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "#252525" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 4.5C2 3.67157 2.67157 3 3.5 3H5.5L7 5H12.5C13.3284 5 14 5.67157 14 6.5V11.5C14 12.3284 13.3284 13 12.5 13H3.5C2.67157 13 2 12.3284 2 11.5V4.5Z" stroke="#F0FE00" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">New Project</div>
                        <div className="text-xs text-gray-500">Group canvases together</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateMenu(false);
                        setShowNewCanvasDialog(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "#252525" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2" y="2" width="12" height="12" rx="2" stroke="#3B82F6" strokeWidth="1.5"/>
                          <path d="M5.5 8H10.5M8 5.5V10.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">New Canvas</div>
                        <div className="text-xs text-gray-500">Create a blank canvas</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {activeView === "community" ? (
          /* Community Templates View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Filter Bar */}
            <div className="px-6 py-4 flex items-center gap-3 overflow-x-auto" style={{ borderBottom: "1px solid #222222" }}>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "all" 
                    ? "text-[#0a0a0a]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={{
                  backgroundColor: selectedCategory === "all" ? "#F0FE00" : "#1a1a1a",
                  border: `1px solid ${selectedCategory === "all" ? "#F0FE00" : "#333333"}`,
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              >
                All Templates
              </button>
              {(Object.keys(TEMPLATE_CATEGORIES) as TemplateCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? "text-[#0a0a0a]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat ? "#F0FE00" : "#1a1a1a",
                    border: `1px solid ${selectedCategory === cat ? "#F0FE00" : "#333333"}`,
                    fontFamily: "system-ui, Inter, sans-serif",
                  }}
                >
                  {TEMPLATE_CATEGORIES[cat].label}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div
                    className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
                    style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
                  >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="4" width="20" height="20" rx="3" stroke="#666666" strokeWidth="2"/>
                      <path d="M10 14H18M14 10V18" stroke="#666666" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                    No templates found
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTemplates.map((template) => {
                    const hasUpvoted = template.upvotedBy.includes(currentUserId);
                    return (
                      <div
                        key={template.id}
                        className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: "#141414", border: "1px solid #222222" }}
                      >
                        {/* Preview Image */}
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {template.previewImage ? (
                            <img
                              src={template.previewImage}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#1a1a1a" }}>
                              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="8" y="8" width="32" height="32" rx="4" stroke="#333333" strokeWidth="2"/>
                                <path d="M16 24H32M24 16V32" stroke="#333333" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )}
                          {/* Category Badge */}
                          <div
                            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: "rgba(0,0,0,0.7)", 
                              color: "#F0FE00",
                              fontFamily: "system-ui, Inter, sans-serif",
                            }}
                          >
                            {TEMPLATE_CATEGORIES[template.category].label}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3
                            className="text-white font-semibold text-base mb-1 truncate"
                            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                          >
                            {template.name}
                          </h3>
                          <p
                            className="text-gray-400 text-sm mb-3 line-clamp-2"
                            style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                          >
                            {template.description}
                          </p>

                          {/* Creator */}
                          <div className="flex items-center gap-2 mb-3">
                            {template.createdBy.avatar ? (
                              <img
                                src={template.createdBy.avatar}
                                alt={template.createdBy.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                                style={{ backgroundColor: "#333333", color: "#ffffff" }}
                              >
                                {template.createdBy.initials}
                              </div>
                            )}
                            <span
                              className="text-sm text-gray-400"
                              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                            >
                              {template.createdBy.name}
                            </span>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: "#252525",
                                  color: "#888888",
                                  fontFamily: "system-ui, Inter, sans-serif",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Stats & Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Upvote Button */}
                              <button
                                type="button"
                                onClick={() => handleUpvoteTemplate(template.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                                  hasUpvoted 
                                    ? "text-[#F0FE00]" 
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                                style={{
                                  backgroundColor: hasUpvoted ? "rgba(240, 254, 0, 0.1)" : "transparent",
                                  fontFamily: "system-ui, Inter, sans-serif",
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M8 3L10 7H14L11 10L12 14L8 11.5L4 14L5 10L2 7H6L8 3Z"
                                    fill={hasUpvoted ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                {template.upvotes}
                              </button>

                              {/* Downloads */}
                              <div
                                className="flex items-center gap-1.5 text-sm text-gray-500"
                                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M7 2V9M7 9L4 6M7 9L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M2 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                {template.downloads}
                              </div>
                            </div>

                            {/* Open Template Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenTemplate(template)}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#0a0a0a] transition-colors hover:opacity-90"
                              style={{
                                backgroundColor: "#F0FE00",
                                fontFamily: "system-ui, Inter, sans-serif",
                              }}
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeView === "workspace-canvas" ? (
          /* Workspace Canvas View - All nodes from all workspace canvases */
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <WorkspaceCanvasView 
                nodes={workspaceNodesData.nodes}
                groups={workspaceNodesData.groups}
                onOpenCanvas={onOpenCanvas}
              />
            </ReactFlowProvider>
          </div>
        ) : activeView === "home" ? (
          <>
            {/* Chaos Ribbon Module - Only on Home view */}
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
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(canvas.id);
                        }}
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 18 18" fill={canvas.isFavorite ? "#F0FE00" : "none"} xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 2L11.09 6.26L16 6.97L12.5 10.34L13.18 15.25L9 13.05L4.82 15.25L5.5 10.34L2 6.97L6.91 6.26L9 2Z" stroke={canvas.isFavorite ? "#F0FE00" : "#ffffff"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCanvasToDelete(canvas.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4H12.667Z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="text-white font-medium text-sm truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                      {canvas.name}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                      Edited {formatDate(canvas.updatedAt)} by {canvas.createdBy.name.split(" ")[0]} {canvas.createdBy.name.split(" ")[1]?.charAt(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        ) : (activeView === "canvases" || activeView === "favorites") ? (
          /* Canvas/Files View with Tab Switcher */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Switcher - Only show on canvases view, not favorites */}
            {activeView === "canvases" && (
              <div className="px-6 py-3 flex items-center gap-1" style={{ borderBottom: "1px solid #222222" }}>
                <button
                  type="button"
                  onClick={() => setCanvasSubView("canvases")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    canvasSubView === "canvases" 
                      ? "bg-white/10 text-white" 
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Canvases
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasSubView("files")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    canvasSubView === "files" 
                      ? "bg-white/10 text-white" 
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                >
                  Files
                </button>
              </div>
            )}

            {/* Content Area */}
            {(activeView === "favorites" || canvasSubView === "canvases") ? (
              <div className="flex-1 overflow-y-auto p-6">
              {filteredCanvases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCanvases.map((canvas) => (
                <div
                  key={canvas.id}
                  onClick={() => onOpenCanvas(canvas.id)}
                  className="group cursor-pointer rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "#141414", border: "1px solid #222222" }}
                >
                  {/* Preview */}
                  <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
                    {canvas.previewImage ? (
                      <img
                        src={canvas.previewImage}
                        alt={canvas.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="8" y="8" width="14" height="14" rx="2" stroke="#444444" strokeWidth="2"/>
                          <rect x="26" y="8" width="14" height="14" rx="2" stroke="#444444" strokeWidth="2"/>
                          <rect x="8" y="26" width="14" height="14" rx="2" stroke="#444444" strokeWidth="2"/>
                          <rect x="26" y="26" width="14" height="14" rx="2" stroke="#444444" strokeWidth="2"/>
                        </svg>
                      </div>
                    )}
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(canvas.id);
                        }}
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 18 18" fill={canvas.isFavorite ? "#F0FE00" : "none"} xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 2L11.09 6.26L16 6.97L12.5 10.34L13.18 15.25L9 13.05L4.82 15.25L5.5 10.34L2 6.97L6.91 6.26L9 2Z" stroke={canvas.isFavorite ? "#F0FE00" : "#ffffff"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCanvasToDelete(canvas.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4H12.667Z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="text-white font-medium text-sm truncate" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                      {canvas.name}
                    </div>
                    <div className="text-gray-500 text-xs mt-1" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                      Edited {formatDate(canvas.updatedAt)} by {canvas.createdBy.name.split(" ")[0]} {canvas.createdBy.name.split(" ")[1]?.charAt(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div
                className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="10" height="10" rx="2" stroke="#666666" strokeWidth="2"/>
                  <rect x="18" y="4" width="10" height="10" rx="2" stroke="#666666" strokeWidth="2"/>
                  <rect x="4" y="18" width="10" height="10" rx="2" stroke="#666666" strokeWidth="2"/>
                  <rect x="18" y="18" width="10" height="10" rx="2" stroke="#666666" strokeWidth="2"/>
                </svg>
              </div>
              <p
                className="text-gray-500 text-sm mb-4"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                {activeView === "favorites" ? "No favorite canvases yet" : "No canvases yet"}
              </p>
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
          )}
              </div>
            ) : (
              /* Files Tree View */
              <div className="flex-1 overflow-y-auto p-6">
                {/* Projects with their canvases and files */}
                {projects.map((project) => (
                  <div key={project.id} className="mb-2">
                    {/* Project Row */}
                    <button
                      type="button"
                      onClick={() => toggleFilesProjectExpanded(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors"
                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                    >
                      <svg 
                        width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
                        className={`transition-transform flex-shrink-0 ${expandedFilesProjects.has(project.id) ? "rotate-90" : ""}`}
                      >
                        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                        <path d="M2 4.5C2 3.67157 2.67157 3 3.5 3H5.5L7 5H12.5C13.3284 5 14 5.67157 14 6.5V11.5C14 12.3284 13.3284 13 12.5 13H3.5C2.67157 13 2 12.3284 2 11.5V4.5Z" fill={project.color} fillOpacity="0.2" stroke={project.color} strokeWidth="1.5"/>
                      </svg>
                      <span className="truncate flex-1 text-left font-medium">{project.name}</span>
                      <span className="text-xs text-gray-500">{getProjectCanvases(project.id).length} canvases</span>
                    </button>

                    {/* Project's Canvases */}
                    {expandedFilesProjects.has(project.id) && (
                      <div className="ml-5 border-l border-gray-800 pl-2">
                        {getProjectCanvases(project.id).map((canvas) => (
                          <div key={canvas.id}>
                            {/* Canvas Row */}
                            <button
                              type="button"
                              onClick={() => toggleFilesCanvasExpanded(canvas.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 transition-colors"
                              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                            >
                              <svg 
                                width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
                                className={`transition-transform flex-shrink-0 ${expandedFilesCanvases.has(canvas.id) ? "rotate-90" : ""}`}
                              >
                                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                              <span className="truncate flex-1 text-left">{canvas.name}</span>
                              <span className="text-xs text-gray-600">{getCanvasFiles(canvas).length} files</span>
                            </button>

                            {/* Canvas's Files */}
                            {expandedFilesCanvases.has(canvas.id) && (
                              <div className="ml-5 border-l border-gray-800 pl-2">
                                {getCanvasFiles(canvas).length === 0 ? (
                                  <div className="px-3 py-1.5 text-xs text-gray-600" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                                    No files
                                  </div>
                                ) : (
                                  getCanvasFiles(canvas).map((node) => (
                                    <button
                                      key={node.id}
                                      type="button"
                                      onClick={() => onOpenCanvas(canvas.id)}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                        <path d="M3 1.5H8.5L11 4V12.5H3V1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M8.5 1.5V4H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <span className="truncate">{(node.data as { label?: string }).label || "Untitled"}</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {getProjectCanvases(project.id).length === 0 && (
                          <div className="px-3 py-1.5 text-xs text-gray-600" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                            No canvases
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Ungrouped Canvases */}
                {getUngroupedCanvases().length > 0 && (
                  <div className="mb-2">
                    <div
                      className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                    >
                      Ungrouped Canvases
                    </div>
                    {getUngroupedCanvases().map((canvas) => (
                      <div key={canvas.id}>
                        {/* Canvas Row */}
                        <button
                          type="button"
                          onClick={() => toggleFilesCanvasExpanded(canvas.id)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 transition-colors"
                          style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                        >
                          <svg 
                            width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"
                            className={`transition-transform flex-shrink-0 ${expandedFilesCanvases.has(canvas.id) ? "rotate-90" : ""}`}
                          >
                            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                            <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          <span className="truncate flex-1 text-left">{canvas.name}</span>
                          <span className="text-xs text-gray-600">{getCanvasFiles(canvas).length} files</span>
                        </button>

                        {/* Canvas's Files */}
                        {expandedFilesCanvases.has(canvas.id) && (
                          <div className="ml-5 border-l border-gray-800 pl-2">
                            {getCanvasFiles(canvas).length === 0 ? (
                              <div className="px-3 py-1.5 text-xs text-gray-600" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                                No files
                              </div>
                            ) : (
                              getCanvasFiles(canvas).map((node) => (
                                <button
                                  key={node.id}
                                  type="button"
                                  onClick={() => onOpenCanvas(canvas.id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                                  style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                    <path d="M3 1.5H8.5L11 4V12.5H3V1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8.5 1.5V4H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span className="truncate">{(node.data as { label?: string }).label || "Untitled"}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {projects.length === 0 && canvases.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div
                      className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
                      style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
                    >
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 8C4 6.34315 5.34315 5 7 5H11L14 8H21C22.6569 8 24 9.34315 24 11V20C24 21.6569 22.6569 23 21 23H7C5.34315 23 4 21.6569 4 20V8Z" stroke="#666666" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm mb-2" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                      No files yet
                    </p>
                    <p className="text-gray-600 text-xs" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
                      Create a canvas and upload files to see them here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
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

              {/* Project Selection */}
              {projects.length > 0 && (
                <div>
                  <label
                    className="block text-xs text-gray-500 mb-1.5"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    Project (Optional)
                  </label>
                  <select
                    value={newCanvasProjectId || ""}
                    onChange={(e) => setNewCanvasProjectId(e.target.value || undefined)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 appearance-none cursor-pointer"
                    style={{
                      backgroundColor: "#0a0a0a",
                      border: "1px solid #333333",
                      fontFamily: "system-ui, Inter, sans-serif",
                    }}
                  >
                    <option value="">No project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowNewProjectDialog(false)}
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
                New Project
              </h2>
              <button
                type="button"
                onClick={() => setShowNewProjectDialog(false)}
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
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="My Project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
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
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProjectColor(color)}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        backgroundColor: color,
                        border: newProjectColor === color ? "2px solid white" : "2px solid transparent",
                        transform: newProjectColor === color ? "scale(1.1)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowNewProjectDialog(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProject}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "#F0FE00",
                  color: "#121212",
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {canvasToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setCanvasToDelete(null)}
          />
          <div
            className="relative w-full max-w-sm rounded-xl p-6"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333333" }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21M8 6V4C8 3.448 8.448 3 9 3H15C15.552 3 16 3.448 16 4V6M19 6V20C19 20.552 18.552 21 18 21H6C5.448 21 5 20.552 5 20V6H19Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-white text-center mb-2" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Delete Canvas
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6" style={{ fontFamily: "system-ui, Inter, sans-serif" }}>
              Are you sure you want to delete &quot;{canvases.find(c => c.id === canvasToDelete)?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCanvasToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                style={{ backgroundColor: "#252525", fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteCanvas(canvasToDelete)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:bg-red-600"
                style={{ backgroundColor: "#ef4444", fontFamily: "system-ui, Inter, sans-serif" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Settings Dialog */}
      <WorkspaceSettingsDialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        settings={workspaceSettings}
        onSettingsChange={onWorkspaceSettingsChange}
        initialTab={settingsInitialTab}
      />

      {/* Template Preview Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setViewingTemplate(null)}
          />
          
          {/* Modal */}
          <div
            className="relative w-full max-w-4xl max-h-[90vh] mx-4 rounded-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "#0f0f0f", border: "1px solid #2a2a2a" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #222222" }}>
              <div className="flex items-center gap-4">
                {viewingTemplate.createdBy.avatar ? (
                  <img
                    src={viewingTemplate.createdBy.avatar}
                    alt={viewingTemplate.createdBy.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: "#333333", color: "#ffffff" }}
                  >
                    {viewingTemplate.createdBy.initials}
                  </div>
                )}
                <div>
                  <h2
                    className="text-white font-semibold text-lg"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    {viewingTemplate.name}
                  </h2>
                  <p
                    className="text-gray-400 text-sm"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    by {viewingTemplate.createdBy.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTemplate(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-hidden relative">
              {viewingTemplate.previewImage ? (
                <img
                  src={viewingTemplate.previewImage}
                  alt={viewingTemplate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[300px]" style={{ backgroundColor: "#1a1a1a" }}>
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="12" y="12" width="56" height="56" rx="6" stroke="#333333" strokeWidth="2"/>
                    <path d="M28 40H52M40 28V52" stroke="#333333" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              )}

              {/* Duplicate Banner */}
              <div 
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{ 
                  background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)",
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "rgba(240, 254, 0, 0.15)" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="6" y="6" width="11" height="11" rx="2" stroke="#F0FE00" strokeWidth="1.5"/>
                        <path d="M14 6V5C14 3.89543 13.1046 3 12 3H5C3.89543 3 3 3.89543 3 5V12C3 13.1046 3.89543 14 5 14H6" stroke="#F0FE00" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div>
                      <p
                        className="text-white text-sm font-medium"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Want to edit this template?
                      </p>
                      <p
                        className="text-gray-400 text-xs"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Duplicate it to your workspace to make changes
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDuplicateTemplate(viewingTemplate)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#0a0a0a] transition-colors hover:opacity-90 flex items-center gap-2 flex-shrink-0"
                    style={{
                      backgroundColor: "#F0FE00",
                      fontFamily: "system-ui, Inter, sans-serif",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M11 5V4C11 3.17157 10.3284 2.5 9.5 2.5H4C3.17157 2.5 2.5 3.17157 2.5 4V9.5C2.5 10.3284 3.17157 11 4 11H5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    Duplicate to Workspace
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with details */}
            <div className="p-5" style={{ borderTop: "1px solid #222222" }}>
              <p
                className="text-gray-300 text-sm mb-4"
                style={{ fontFamily: "system-ui, Inter, sans-serif" }}
              >
                {viewingTemplate.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {viewingTemplate.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-xs"
                      style={{
                        backgroundColor: "#1a1a1a",
                        color: "#888888",
                        border: "1px solid #2a2a2a",
                        fontFamily: "system-ui, Inter, sans-serif",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-1.5 text-sm text-gray-400"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M8 3L10 7H14L11 10L12 14L8 11.5L4 14L5 10L2 7H6L8 3Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {viewingTemplate.upvotes} upvotes
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-sm text-gray-400"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 2V9M7 9L4 6M7 9L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {viewingTemplate.downloads} downloads
                  </div>
                </div>
              </div>
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
