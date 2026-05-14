"use client";

import React, { useState, useCallback, useEffect } from "react";
import { upload } from "@vercel/blob/client";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type NodeChange,
} from "@xyflow/react";

import type { AtlasNode, FileExtension, FileNodeData, UploadedFile, WorkspaceSettings, Canvas, CanvasComment, MoodboardNodeData, CanvasTemplate } from "@/lib/atlas-types";
import { INITIAL_FILE_NODES, INITIAL_EDGES, getFileCategoryFromExtension, DEFAULT_WORKSPACE_SETTINGS, WORKSPACE_MEMBERS, SUPPORTED_EXTENSIONS } from "@/lib/atlas-types";
import { AtlasCanvas } from "./atlas-canvas";
import { AtlasToolbar } from "./atlas-toolbar";
import { CanvasSideToolbar } from "./canvas-side-toolbar";
import { FileDetailModal } from "./file-detail-modal";
import { UploadDialog } from "./upload-dialog";
import { UploadProgress } from "./upload-progress";
import { WorkspaceSettingsDialog } from "./workspace-settings";
import { MockupGeneratorDialog } from "./mockup-generator-dialog";
import { MoodboardExpanded } from "./moodboard-expanded";
import { PresentationViewer } from "./presentation-viewer";
import { SaveTemplateDialog } from "./save-template-dialog";

interface AtlasEditorProps {
  canvas: Canvas;
  onCanvasChange: (canvas: Canvas) => void;
  onSaveTemplate?: (template: CanvasTemplate) => void;
  onBack: () => void;
  workspaceSettings: WorkspaceSettings;
  onWorkspaceSettingsChange: (settings: WorkspaceSettings) => void;
}

function AtlasEditorInner({ canvas, onCanvasChange, onBack, workspaceSettings, onWorkspaceSettingsChange, onSaveTemplate }: AtlasEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AtlasNode>(canvas.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(canvas.edges);
  const [comments, setComments] = useState<CanvasComment[]>(canvas.comments || []);
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Array<{
    id: string;
    fileName: string;
    progress: number;
    status: "uploading" | "complete" | "error";
    error?: string;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Comment mode state
  const [commentMode, setCommentMode] = useState(false);
  const [newCommentPosition, setNewCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  
  // File detail modal state
  const [detailModalNodeId, setDetailModalNodeId] = useState<string | null>(null);

  // Mockup generator state
  const [mockupSourceFile, setMockupSourceFile] = useState<FileNodeData | null>(null);

  // Moodboard state
  const [expandedMoodboardId, setExpandedMoodboardId] = useState<string | null>(null);

  // Presentation state
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationEdges, setPresentationEdges] = useState<Edge[]>([]);
  const [isPresenting, setIsPresenting] = useState(false);

  // Listen for mockup generation events from file nodes
  useEffect(() => {
    const handleMockupEvent = (e: CustomEvent<{ nodeId: string; fileData: FileNodeData }>) => {
      setMockupSourceFile(e.detail.fileData);
    };

    window.addEventListener("atlas:generate-mockup", handleMockupEvent as EventListener);
    return () => {
      window.removeEventListener("atlas:generate-mockup", handleMockupEvent as EventListener);
    };
  }, []);

  // Handle creating nodes from generated mockups
  const handleCreateMockupNodes = useCallback(
    (mockups: Array<{ imageUrl: string; name: string }>) => {
      const newNodes: AtlasNode[] = mockups.map((mockup, index) => ({
        id: `mockup-${Date.now()}-${index}`,
        type: "file" as const,
        position: { 
          x: 300 + (nodes.length + index) * 30, 
          y: 200 + (nodes.length + index) * 20 
        },
        data: {
          label: mockup.name,
          fileName: `${mockup.name}.png`,
          product: "atlas" as const,
          status: "draft" as const,
          fileExtension: ".png" as const,
          lastModified: "Generated just now",
          previewImages: [mockup.imageUrl],
          tasks: [],
        },
      }));

      setNodes((nds) => [...nds, ...newNodes]);
    },
    [nodes.length, setNodes]
  );

  // Current user (first member for demo)
  const currentUser = workspaceSettings.members[0] || WORKSPACE_MEMBERS[0];

  // Sync canvas changes back to parent
  const syncCanvas = useCallback((updatedComments?: CanvasComment[]) => {
    onCanvasChange({
      ...canvas,
      nodes,
      edges,
      comments: updatedComments || comments,
      updatedAt: new Date().toISOString(),
    });
  }, [canvas, nodes, edges, comments, onCanvasChange]);

  // Auto-save nodes and edges when they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only save if there are actual changes (compare by length as a quick check)
      if (nodes.length > 0 || edges.length > 0) {
        onCanvasChange({
          ...canvas,
          nodes,
          edges,
          comments,
          updatedAt: new Date().toISOString(),
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [nodes, edges]); // Only trigger on nodes/edges changes, not canvas/comments to avoid loops

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "default",
            animated: true,
            style: { strokeWidth: 2, stroke: "#52525b", strokeDasharray: "5 5" },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const handleNodesUpdate = useCallback(
    (newNodes: AtlasNode[]) => {
      setNodes(newNodes);
    },
    [setNodes]
  );

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Partial<FileNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev
      );
    },
    [setNodes]
  );

  const handleAddNode = useCallback(
    (extension: FileExtension, position?: { x: number; y: number }, sourceNodeId?: string) => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const nodeId = `file-${Date.now()}`;
      const nodePosition = position || { x: 100 + nodes.length * 50, y: 100 + nodes.length * 30 };

      const newNode: AtlasNode = {
        id: nodeId,
        type: "file",
        position: nodePosition,
        data: {
          label: "Untitled File",
          fileName: `Untitled File${extension}`,
          product: "atlas",
          status: "draft",
          fileExtension: extension,
          lastModified: formattedDate,
        },
      };
      setNodes((nds) => [...nds, newNode]);

      // If source node provided, create an edge
      if (sourceNodeId) {
        setEdges((eds) => [...eds, {
          id: `edge-${sourceNodeId}-${nodeId}`,
          source: sourceNodeId,
          target: nodeId,
        }]);
      }
    },
    [nodes.length, setNodes, setEdges]
  );

  const handleAddStatusPill = useCallback((position?: { x: number; y: number }, sourceNodeId?: string) => {
    const nodeId = `status-${Date.now()}`;
    const nodePosition = position || { x: 150 + nodes.length * 30, y: 80 + nodes.length * 20 };

    const newNode: AtlasNode = {
      id: nodeId,
      type: "statusPill",
      position: nodePosition,
      data: {
        label: "Status",
        color: "#e5e5e5",
      },
    };
    setNodes((nds) => [...nds, newNode]);

    // If source node provided, create an edge
    if (sourceNodeId) {
      setEdges((eds) => [...eds, {
        id: `edge-${sourceNodeId}-${nodeId}`,
        source: sourceNodeId,
        target: nodeId,
      }]);
    }
  }, [nodes.length, setNodes, setEdges]);

  const handleAddTextNode = useCallback(
    (textType: "brief" | "note" | "description", position?: { x: number; y: number }, sourceNodeId?: string) => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const typeLabels = {
        brief: "Creative Brief",
        note: "Note",
        description: "Description",
      };

      const nodeId = `text-${Date.now()}`;
      const nodePosition = position || { x: 150 + nodes.length * 30, y: 100 + nodes.length * 20 };

      const newNode: AtlasNode = {
        id: nodeId,
        type: "text",
        position: nodePosition,
        data: {
          label: typeLabels[textType],
          content: "",
          textType,
          lastModified: formattedDate,
        },
      };
      setNodes((nds) => [...nds, newNode]);

      // If source node provided, create an edge
      if (sourceNodeId) {
        setEdges((eds) => [...eds, {
          id: `edge-${sourceNodeId}-${nodeId}`,
          source: sourceNodeId,
          target: nodeId,
        }]);
      }
    },
    [nodes.length, setNodes, setEdges]
  );

  const handleAddSageNode = useCallback(
    (sageType: "chatbot" | "overview" | "stakeholder", position?: { x: number; y: number }, sourceNodeId?: string) => {
      const nodeId = `sage-${Date.now()}`;
      const nodePosition = position || { x: 150 + nodes.length * 30, y: 100 + nodes.length * 20 };

      let newNode: AtlasNode;

      if (sageType === "chatbot") {
        newNode = {
          id: nodeId,
          type: "sageChatbot",
          position: nodePosition,
          data: {
            label: "Sage Chat",
            messages: [],
            lastModified: new Date().toISOString(),
          },
        };
      } else if (sageType === "overview") {
        newNode = {
          id: nodeId,
          type: "sageOverview",
          position: nodePosition,
          data: {
            label: "Project Overview",
            projectProgress: 65,
            alignmentScore: 78,
            summary: "Project is progressing well with most stakeholders aligned. Focus on completing the remaining design reviews.",
            lastUpdated: "just now",
          },
        };
      } else {
        // stakeholder
        newNode = {
          id: nodeId,
          type: "stakeholder",
          position: nodePosition,
          data: {
            label: "Stakeholder",
            stakeholder: WORKSPACE_MEMBERS[0],
            comprehensionLevel: "medium",
            alignmentStatus: "aligned",
            notes: "Key decision maker for brand direction",
            lastInteraction: "2 days ago",
            keyInsights: [
              "Prefers modern, minimal aesthetics",
              "Values consistency across touchpoints",
            ],
          },
        };
      }

      setNodes((nds) => [...nds, newNode]);

      // If source node provided, create an edge
      if (sourceNodeId) {
        setEdges((eds) => [...eds, {
          id: `edge-${sourceNodeId}-${nodeId}`,
          source: sourceNodeId,
          target: nodeId,
        }]);
      }
    },
    [nodes.length, setNodes, setEdges]
  );

  const handleAddOperationalNode = useCallback(
    (opType: "capacity" | "financial" | "projectHealth" | "pipeline" | "teamHealth", position?: { x: number; y: number }, sourceNodeId?: string) => {
      const nodeId = `op-${Date.now()}`;
      const nodePosition = position || { x: 150 + nodes.length * 30, y: 100 + nodes.length * 20 };

      let newNode: AtlasNode;

      if (opType === "capacity") {
        newNode = {
          id: nodeId,
          type: "capacity",
          position: nodePosition,
          data: {
            label: "Capacity & Resourcing",
            teamMembers: WORKSPACE_MEMBERS.slice(0, 3).map((m, idx) => ({
              member: m,
              utilizationRate: 75 + idx * 8,
              currentAllocation: 80 + idx * 5,
              plannedAllocation: 85,
              benchTime: idx === 0 ? 12 : 0,
              skills: ["UI Design", "Branding"],
            })),
            lastUpdated: "just now",
          },
        };
      } else if (opType === "financial") {
        newNode = {
          id: nodeId,
          type: "financial",
          position: nodePosition,
          data: {
            label: "Financial Performance",
            projectMargin: 28,
            budgetConsumed: 65,
            revenueRealized: 72,
            blendedRateEfficiency: 94,
            utilizationAdjustedMargin: 24,
            status: "healthy",
            lastUpdated: "just now",
          },
        };
      } else if (opType === "projectHealth") {
        newNode = {
          id: nodeId,
          type: "projectHealth",
          position: nodePosition,
          data: {
            label: "Project Health",
            daysSinceClientTouchpoint: 3,
            openFeedbackCycles: 2,
            revisionCount: 4,
            projectPhase: "design",
            healthStatus: "on-track",
            lastUpdated: "just now",
          },
        };
      } else if (opType === "pipeline") {
        newNode = {
          id: nodeId,
          type: "pipeline",
          position: nodePosition,
          data: {
            label: "Pipeline Forecast",
            forecast30Days: [
              { projectName: "Acme Rebrand", probability: 85, estimatedHours: 120 },
              { projectName: "TechCorp Website", probability: 60, estimatedHours: 80 },
            ],
            forecast60Days: [
              { projectName: "StartupX Identity", probability: 40, estimatedHours: 60 },
            ],
            forecast90Days: [],
            currentCapacity: 320,
            projectedLoad: 260,
            capacityStatus: "balanced",
            lastUpdated: "just now",
          },
        };
      } else {
        // teamHealth
        newNode = {
          id: nodeId,
          type: "teamHealth",
          position: nodePosition,
          data: {
            label: "Team Health",
            feedbackLoopVelocity: 18,
            revisionToApprovalRatio: 2.3,
            timeSavedHours: 42,
            trendDirection: "improving",
            lastUpdated: "just now",
          },
        };
      }

      setNodes((nds) => [...nds, newNode]);

      // If source node provided, create an edge
      if (sourceNodeId) {
        setEdges((eds) => [...eds, {
          id: `edge-${sourceNodeId}-${nodeId}`,
          source: sourceNodeId,
          target: nodeId,
        }]);
      }
    },
    [nodes.length, setNodes, setEdges]
  );

  // Handle creating a moodboard from selected nodes
  const handleCreateMoodboard = useCallback(
    (nodeIds: string[]) => {
      // Get the selected file nodes
      const selectedNodes = nodes.filter(n => nodeIds.includes(n.id) && n.type === "file");
      if (selectedNodes.length < 2) return;

      // Calculate center position of selected nodes
      const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
      const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;

      // Extract images from selected nodes
      const images = selectedNodes.map(node => {
        const fileData = node.data as FileNodeData;
        return {
          id: node.id,
          url: fileData.uploadedFile?.url || fileData.thumbnail || "",
          fileName: fileData.fileName || fileData.label || "Image",
          thumbnail: fileData.thumbnail,
        };
      }).filter(img => img.url);

      // Create moodboard node
      const moodboardNode: AtlasNode = {
        id: `moodboard-${Date.now()}`,
        type: "moodboard",
        position: { x: avgX, y: avgY },
        data: {
          label: `Moodboard (${images.length})`,
          images,
          isExpanded: false,
          createdAt: new Date().toISOString(),
        } as MoodboardNodeData,
      };

      // Remove the original nodes and add the moodboard
      setNodes(nds => [
        ...nds.filter(n => !nodeIds.includes(n.id)),
        moodboardNode,
      ]);

      // Remove edges connected to the grouped nodes
      setEdges(eds => eds.filter(e => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)));
    },
    [nodes, setNodes, setEdges]
  );

  // Handle clicking a moodboard to expand it
  const handleMoodboardClick = useCallback(
    (nodeId: string) => {
      setExpandedMoodboardId(nodeId);
    },
    []
  );

  // Handle ungrouping a moodboard back into individual nodes
  const handleUngroupMoodboard = useCallback(
    () => {
      if (!expandedMoodboardId) return;
      
      const moodboardNode = nodes.find(n => n.id === expandedMoodboardId);
      if (!moodboardNode || moodboardNode.type !== "moodboard") return;

      const moodboardData = moodboardNode.data as MoodboardNodeData;
      const basePosition = moodboardNode.position;

      // Create individual file nodes from the moodboard images
      const newNodes: AtlasNode[] = moodboardData.images.map((img, index) => ({
        id: `file-${Date.now()}-${index}`,
        type: "file" as const,
        position: {
          x: basePosition.x + (index % 3) * 250,
          y: basePosition.y + Math.floor(index / 3) * 200,
        },
        data: {
          label: img.fileName,
          fileName: img.fileName,
          fileType: "image",
          fileExtension: "png",
          fileCategory: "image",
          status: "approved",
          product: "brand",
          thumbnail: img.thumbnail || img.url,
          lastModified: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          connectedNodes: 0,
          tasks: { total: 0, completed: 0 },
          uploadedFile: { url: img.url, name: img.fileName },
        } as FileNodeData,
      }));

      // Remove moodboard and add individual nodes
      setNodes(nds => [
        ...nds.filter(n => n.id !== expandedMoodboardId),
        ...newNodes,
      ]);

      setExpandedMoodboardId(null);
    },
    [expandedMoodboardId, nodes, setNodes]
  );

  // Handle presentation edge connection
  const handlePresentationConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      const newEdge: Edge = {
        id: `presentation-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: "default",
      };
      
      setPresentationEdges(eds => [...eds, newEdge]);
    },
    []
  );

  // Start presentation
  const handleStartPresentation = useCallback(() => {
    if (presentationEdges.length > 0) {
      setIsPresenting(true);
    }
  }, [presentationEdges]);

  // Clear presentation edges when exiting presentation mode
  const handlePresentationModeChange = useCallback((enabled: boolean) => {
    setPresentationMode(enabled);
    if (!enabled) {
      // Optionally clear edges when exiting, or keep them
      // setPresentationEdges([]);
    }
  }, []);

  const handleDoubleClickCanvas = useCallback(
    (position: { x: number; y: number }) => {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const newNode: AtlasNode = {
        id: `file-${Date.now()}`,
        type: "file",
        position,
        data: {
          label: "Untitled File",
          fileName: "Untitled File.fig",
          product: "atlas",
          status: "draft",
          fileExtension: ".fig",
          lastModified: formattedDate,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const handleFilesUploaded = useCallback(
    (files: Array<{
      fileName: string;
      extension: FileExtension;
      uploadedFile: UploadedFile;
      previewUrl?: string;
    }>) => {
      const newNodes: AtlasNode[] = files.map((file, index) => {
        const label = file.fileName.replace(file.extension, "");
        const previewImages = file.previewUrl ? [file.previewUrl] : undefined;
        const isImage = file.extension.match(/^\.(png|jpg|jpeg|gif|webp|avif)$/i);
        
        return {
          id: `file-${Date.now()}-${index}`,
          type: "file" as const,
          position: { x: 150 + (index % 3) * 300, y: 150 + Math.floor(index / 3) * 250 },
          data: {
            label,
            fileName: file.fileName,
            product: "atlas" as const,
            status: "draft" as const,
            fileExtension: file.extension,
            fileType: isImage ? "image" : "document",
            fileCategory: isImage ? "image" : "document",
            lastModified: "Updated just now",
            uploadedFile: file.uploadedFile,
            previewImages,
            tasks: [],
          },
        };
      });

      setNodes((nds) => [...nds, ...newNodes]);
    },
    [setNodes]
  );

  // Handle files dropped directly onto canvas
  const handleFileDrop = useCallback(
    async (files: FileList, position: { x: number; y: number }) => {
      const uploadedResults: Array<{
        fileName: string;
        extension: FileExtension;
        uploadedFile: UploadedFile;
        previewUrl?: string;
      }> = [];

      // Filter supported files first
      const supportedFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(extension as FileExtension)) {
          supportedFiles.push(file);
        }
      }

      if (supportedFiles.length === 0) return;

      // Initialize upload progress for all files
      const initialProgress = supportedFiles.map((file, index) => ({
        id: `upload-${Date.now()}-${index}`,
        fileName: file.name,
        progress: 0,
        status: "uploading" as const,
      }));
      setUploadProgress(initialProgress);

      for (let i = 0; i < supportedFiles.length; i++) {
        const file = supportedFiles[i];
        const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        const uploadId = initialProgress[i].id;

        // Update progress to show we're starting this file
        setUploadProgress(prev => prev.map(p => 
          p.id === uploadId ? { ...p, progress: 5 } : p
        ));

        try {
          // Use client upload for direct-to-blob uploads (bypasses 4MB API limit)
          const blob = await upload(file.name, file, {
            access: "private",
            handleUploadUrl: "/api/upload/client",
            onUploadProgress: (progress) => {
              setUploadProgress(prev => prev.map(p => 
                p.id === uploadId ? { ...p, progress: Math.round(progress.percentage) } : p
              ));
            },
          });

          const isImage = extension.match(/^\.(png|jpg|jpeg|gif|webp|avif)$/i);
          const servedUrl = `/api/file?pathname=${encodeURIComponent(blob.pathname)}`;

          uploadedResults.push({
            fileName: file.name,
            extension: extension as FileExtension,
            uploadedFile: {
              url: servedUrl,
              pathname: blob.pathname,
              size: file.size,
              uploadedAt: new Date().toISOString(),
            },
            previewUrl: isImage ? servedUrl : undefined,
          });

          // Mark as complete
          setUploadProgress(prev => prev.map(p => 
            p.id === uploadId ? { ...p, progress: 100, status: "complete" } : p
          ));
        } catch (error) {
          console.error("Error uploading file:", file.name, error);
          const errorMessage = error instanceof Error ? error.message : "Upload failed";
          setUploadProgress(prev => prev.map(p => 
            p.id === uploadId ? { ...p, status: "error", error: errorMessage } : p
          ));
        }
      }

      // Create nodes for uploaded files, positioned around the drop point
      if (uploadedResults.length > 0) {
        const newNodes: AtlasNode[] = uploadedResults.map((file, index) => {
          const label = file.fileName.replace(file.extension, "");
          const previewImages = file.previewUrl ? [file.previewUrl] : undefined;
          const isImage = file.extension.match(/^\.(png|jpg|jpeg|gif|webp|avif)$/i);
          
          // Offset each file slightly from drop position
          const offsetX = (index % 3) * 260;
          const offsetY = Math.floor(index / 3) * 220;
          
          return {
            id: `file-${Date.now()}-${index}`,
            type: "file" as const,
            position: { 
              x: position.x + offsetX - 110, 
              y: position.y + offsetY - 80 
            },
            data: {
              label,
              fileName: file.fileName,
              product: "atlas" as const,
              status: "draft" as const,
              fileExtension: file.extension,
              fileType: isImage ? "image" : "document",
              fileCategory: isImage ? "image" : "document",
              lastModified: "Updated just now",
              uploadedFile: file.uploadedFile,
              previewImages,
              tasks: [],
            },
          };
        });

        setNodes((nds) => [...nds, ...newNodes]);
      }
    },
    [setNodes]
  );

  const handleNodesChangeWrapper = useCallback(
    (changes: NodeChange<AtlasNode>[]) => {
      onNodesChange(changes);

      for (const change of changes) {
        if (change.type === "select" && change.selected) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            setSelectedNode(node);
          }
        } else if (change.type === "select" && !change.selected) {
          if (selectedNode?.id === change.id) {
            setSelectedNode(null);
          }
        }
      }
    },
    [onNodesChange, nodes, selectedNode]
  );

  // Comment handlers
  const handleCanvasClick = useCallback((position: { x: number; y: number }) => {
    if (commentMode) {
      setNewCommentPosition(position);
      setSelectedCommentId(null);
    }
  }, [commentMode]);

  const handleCommentSelect = useCallback((commentId: string | null) => {
    setSelectedCommentId(commentId);
    setNewCommentPosition(null);
  }, []);

  const handleCommentAdd = useCallback((content: string, position: { x: number; y: number }) => {
    const newComment: CanvasComment = {
      id: `comment-${Date.now()}`,
      position,
      content,
      author: currentUser,
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };
    
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setNewCommentPosition(null);
    setCommentMode(false);
    setSelectedCommentId(newComment.id);
    syncCanvas(updatedComments);
  }, [comments, currentUser, syncCanvas]);

  const handleCommentUpdate = useCallback((updatedComment: CanvasComment) => {
    const updatedComments = comments.map(c => 
      c.id === updatedComment.id ? updatedComment : c
    );
    setComments(updatedComments);
    syncCanvas(updatedComments);
  }, [comments, syncCanvas]);

  const handleCommentDelete = useCallback((commentId: string) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);
    setSelectedCommentId(null);
    syncCanvas(updatedComments);
  }, [comments, syncCanvas]);

  const handleCancelNewComment = useCallback(() => {
    setNewCommentPosition(null);
  }, []);

  const handleCommentModeChange = useCallback((enabled: boolean) => {
    setCommentMode(enabled);
    if (!enabled) {
      setNewCommentPosition(null);
    }
    setSelectedCommentId(null);
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>
      <AtlasToolbar
        canvasName={canvas.name}
        onBack={onBack}
        onCanvasNameChange={(name) => onCanvasChange({ ...canvas, name })}
        onSaveAsTemplate={() => setShowSaveTemplateDialog(true)}
      />

      <div className="flex-1 flex overflow-hidden relative" style={{ marginTop: 0 }}>
        <AtlasCanvas
          nodes={nodes}
          edges={edges}
          searchQuery={searchQuery}
          comments={comments}
          commentMode={commentMode}
          newCommentPosition={newCommentPosition}
          selectedCommentId={selectedCommentId}
          currentUser={currentUser}
          onNodesChange={handleNodesChangeWrapper}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesUpdate={handleNodesUpdate}
          onDoubleClick={handleDoubleClickCanvas}
          onCanvasClick={handleCanvasClick}
          onCommentSelect={handleCommentSelect}
          onCommentAdd={handleCommentAdd}
          onCommentUpdate={handleCommentUpdate}
          onCommentDelete={handleCommentDelete}
          onCancelNewComment={handleCancelNewComment}
          onNodeDoubleClick={setDetailModalNodeId}
          onFileDrop={handleFileDrop}
          onUploadFile={(files, position) => {
            // Use center of canvas if no position provided
            const uploadPosition = position || { x: 400, y: 300 };
            handleFileDrop(files, uploadPosition);
          }}
          onAddStatusPill={handleAddStatusPill}
          onAddTextNode={handleAddTextNode}
          onAddSageNode={handleAddSageNode}
onAddOperationalNode={handleAddOperationalNode}
  onOpenAIGenerate={(type) => {
    if (type === "mockup") {
      // Find first file node with an image to use as source
      const fileNode = nodes.find(n => n.type === "file" && (n.data as FileNodeData).uploadedFile?.url);
      if (fileNode) {
        setMockupSourceFile(fileNode.data as FileNodeData);
      } else {
        // No file found - show alert
        alert("Please upload an image first to generate mockups from.");
      }
    } else if (type === "collateral") {
      // TODO: Implement collateral generation
      alert("Collateral generation coming soon!");
    }
  }}
  onCreateMoodboard={handleCreateMoodboard}
          onMoodboardClick={handleMoodboardClick}
          presentationMode={presentationMode}
          presentationEdges={presentationEdges}
          onPresentationConnect={handlePresentationConnect}
        />

        <CanvasSideToolbar
          onAddStatusPill={handleAddStatusPill}
          onAddTextNode={handleAddTextNode}
          onAddSageNode={handleAddSageNode}
          onAddOperationalNode={handleAddOperationalNode}
          onUploadFile={(files) => handleFileDrop(files, { x: 400, y: 300 })}
          onSettingsClick={() => setShowSettingsDialog(true)}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
          commentMode={commentMode}
          onCommentModeChange={handleCommentModeChange}
          commentCount={comments.filter(c => !c.resolved).length}
          presentationMode={presentationMode}
          onPresentationModeChange={handlePresentationModeChange}
          onStartPresentation={handleStartPresentation}
          presentationEdgeCount={presentationEdges.length}
        />

        
      </div>

      {/* Upload Progress Indicator */}
      <UploadProgress 
        uploads={uploadProgress} 
        onDismiss={() => setUploadProgress([])} 
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onFilesUploaded={handleFilesUploaded}
      />

      {/* Settings Dialog */}
      <WorkspaceSettingsDialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        settings={workspaceSettings}
        onSettingsChange={onWorkspaceSettingsChange}
        onMakeTemplate={() => {
          setShowSettingsDialog(false);
          setShowSaveTemplateDialog(true);
        }}
      />

      {/* Save as Template Dialog */}
      <SaveTemplateDialog
        open={showSaveTemplateDialog}
        onClose={() => setShowSaveTemplateDialog(false)}
        canvas={canvas}
        currentUser={workspaceSettings.members[0]}
        onSaveTemplate={(template) => {
          onSaveTemplate?.(template);
          setShowSaveTemplateDialog(false);
        }}
      />

      {/* File Detail Modal */}
      {detailModalNodeId && (() => {
        const node = nodes.find(n => n.id === detailModalNodeId && n.type === "file");
        if (!node) return null;
        const fileData = node.data as FileNodeData;
        return (
          <FileDetailModal
            isOpen={true}
            onClose={() => setDetailModalNodeId(null)}
            fileData={fileData}
            onUpdateFile={(updates) => {
              setNodes(nds => nds.map(n => 
                n.id === detailModalNodeId 
                  ? { ...n, data: { ...n.data, ...updates } }
                  : n
              ));
            }}
          />
        );
      })()}

      {/* Mockup Generator Dialog */}
      {mockupSourceFile && (
        <MockupGeneratorDialog
          isOpen={true}
          onClose={() => setMockupSourceFile(null)}
          sourceFile={mockupSourceFile}
          onCreateNodes={handleCreateMockupNodes}
        />
      )}

      {/* Moodboard Expanded View */}
      {expandedMoodboardId && (() => {
        const moodboardNode = nodes.find(n => n.id === expandedMoodboardId);
        if (!moodboardNode || moodboardNode.type !== "moodboard") return null;
        return (
          <MoodboardExpanded
            data={moodboardNode.data as MoodboardNodeData}
            onClose={() => setExpandedMoodboardId(null)}
            onUngroup={handleUngroupMoodboard}
            onDataChange={(newData) => {
              setNodes(prevNodes => prevNodes.map(n => 
                n.id === expandedMoodboardId 
                  ? { ...n, data: newData }
                  : n
              ));
            }}
          />
        );
      })()}

      {/* Presentation Viewer */}
      {isPresenting && (
        <PresentationViewer
          nodes={nodes}
          presentationEdges={presentationEdges}
          onClose={() => {
            setIsPresenting(false);
            setPresentationMode(false);
          }}
        />
      )}
    </div>
  );
}

export function AtlasEditor(props: AtlasEditorProps) {
  return (
    <ReactFlowProvider>
      <AtlasEditorInner {...props} />
    </ReactFlowProvider>
  );
}
