import type { Node, Edge } from "@xyflow/react";

// Product types
export type ProductType = "atlas" | "synthesis" | "sage";

// Status types
export type FileStatus = "draft" | "in-review" | "approved";

// File extension types - Design source files
export type DesignFileExtension = ".fig" | ".ai" | ".psd" | ".indd" | ".xd" | ".sketch" | ".afdesign" | ".afphoto" | ".afpub" | ".glyphs" | ".procreate" | ".studio";

// File extension types - Image/raster
export type ImageFileExtension = ".png" | ".jpg" | ".jpeg" | ".webp" | ".tiff" | ".tif" | ".raw" | ".cr2" | ".arw" | ".heic" | ".gif" | ".bmp" | ".avif";

// File extension types - Vector/print-ready
export type VectorFileExtension = ".svg" | ".eps" | ".pdf" | ".pdfx" | ".wmf" | ".emf" | ".dxf";

// File extension types - Video
export type VideoFileExtension = ".mp4" | ".mov" | ".avi" | ".webm" | ".mkv";

// File extension types - Documents
export type DocumentFileExtension = ".pptx" | ".doc" | ".docx" | ".txt" | ".md";

// All file extensions
export type FileExtension = DesignFileExtension | ImageFileExtension | VectorFileExtension | VideoFileExtension | DocumentFileExtension;

// Supported file extensions for upload validation
export const SUPPORTED_EXTENSIONS: FileExtension[] = [
  // Design source files
  ".fig", ".ai", ".psd", ".indd", ".xd", ".sketch", ".afdesign", ".afphoto", ".afpub", ".glyphs", ".procreate", ".studio",
  // Image/raster
  ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".raw", ".cr2", ".arw", ".heic", ".gif", ".bmp", ".avif",
  // Vector/print-ready
  ".svg", ".eps", ".pdf", ".pdfx", ".wmf", ".emf", ".dxf",
  // Video
  ".mp4", ".mov", ".avi", ".webm", ".mkv",
  // Documents
  ".pptx", ".doc", ".docx", ".txt", ".md",
];

// File category from extension
export function getFileCategoryFromExtension(ext: string): "design" | "image" | "vector" | "video" | "document" {
  const designExts = [".fig", ".ai", ".psd", ".indd", ".xd", ".sketch", ".afdesign", ".afphoto", ".afpub", ".glyphs", ".procreate", ".studio"];
  const imageExts = [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".raw", ".cr2", ".arw", ".heic", ".gif", ".bmp", ".avif"];
  const vectorExts = [".svg", ".eps", ".pdf", ".pdfx", ".wmf", ".emf", ".dxf"];
  const videoExts = [".mp4", ".mov", ".avi", ".webm", ".mkv"];
  
  if (designExts.includes(ext)) return "design";
  if (imageExts.includes(ext)) return "image";
  if (vectorExts.includes(ext)) return "vector";
  if (videoExts.includes(ext)) return "video";
  return "document";
}

// File type categories
export type FileTypeCategory = "design" | "document" | "video" | "image" | "brand";

// Product colors
export const PRODUCT_COLORS: Record<ProductType, string> = {
  atlas: "#534AB7",
  synthesis: "#1D9E75",
  sage: "#BA7517",
};

// Status colors
export const STATUS_COLORS: Record<FileStatus, string> = {
  draft: "#444441",
  "in-review": "#185FA5",
  approved: "#3B6D11",
};

// Product labels
export const PRODUCT_LABELS: Record<ProductType, string> = {
  atlas: "Atlas",
  synthesis: "Synthesis",
  sage: "Sage",
};

// Status labels
export const STATUS_LABELS: Record<FileStatus, string> = {
  draft: "Draft",
  "in-review": "In Review",
  approved: "Approved",
};

// Task item interface
export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  assignee?: WorkspaceMember;
}

// Workspace member interface
export interface WorkspaceMember {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
}

// Default workspace members
export const WORKSPACE_MEMBERS: WorkspaceMember[] = [
  { id: "m1", name: "Alex Chen", initials: "AC" },
  { id: "m2", name: "Sarah Miller", initials: "SM" },
  { id: "m3", name: "James Wilson", initials: "JW" },
  { id: "m4", name: "Emily Davis", initials: "ED" },
  { id: "m5", name: "Michael Brown", initials: "MB" },
];

// Uploaded file info
export interface UploadedFile {
  url: string; // Blob URL for the file
  pathname: string; // Blob pathname
  size: number; // File size in bytes
  uploadedAt: string; // ISO date string
}

// File node data interface
export interface FileNodeData {
  label: string;
  fileName: string;
  product: ProductType;
  status: FileStatus;
  fileExtension: FileExtension;
  lastModified: string;
  previewImages?: string[]; // Array of up to 4 preview image URLs
  tasks?: TaskItem[]; // Task items for this file
  uploadedFile?: UploadedFile; // Uploaded file data from Vercel Blob
}

// Atlas node type
export type AtlasNodeType = "file";

// Atlas workflow node
export type AtlasNode = Node<FileNodeData, AtlasNodeType>;

// Filter state
export interface FilterState {
  product: ProductType | "all";
  status: FileStatus | "all";
}

// Initial file nodes for the branding project
export const INITIAL_FILE_NODES: AtlasNode[] = [
  {
    id: "file-1",
    type: "file",
    position: { x: 100, y: 100 },
    data: {
      label: "Brand Guidelines",
      fileName: "Brand Guidelines.pdf",
      product: "atlas",
      status: "approved",
      fileExtension: ".pdf",
      lastModified: "Updated 2 days ago",
      tasks: [
        { id: "t1", title: "Review color palette", completed: true, assignee: WORKSPACE_MEMBERS[0] },
        { id: "t2", title: "Update typography section", completed: false, assignee: WORKSPACE_MEMBERS[1] },
        { id: "t3", title: "Add logo usage examples", completed: false },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=200&h=200&fit=crop",
      ],
    },
  },
  {
    id: "file-2",
    type: "file",
    position: { x: 400, y: 50 },
    data: {
      label: "Logo Suite",
      fileName: "Logo Suite.ai",
      product: "synthesis",
      status: "approved",
      fileExtension: ".ai",
      lastModified: "Updated 4 days ago",
      tasks: [
        { id: "t4", title: "Export SVG versions", completed: true, assignee: WORKSPACE_MEMBERS[2] },
        { id: "t5", title: "Create favicon set", completed: true, assignee: WORKSPACE_MEMBERS[0] },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1634942537034-2531766767d1?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&h=200&fit=crop",
      ],
    },
  },
  {
    id: "file-3",
    type: "file",
    position: { x: 700, y: 150 },
    data: {
      label: "Campaign Moodboard",
      fileName: "Campaign Moodboard.fig",
      product: "synthesis",
      status: "in-review",
      fileExtension: ".fig",
      lastModified: "Updated yesterday",
      tasks: [
        { id: "t6", title: "Add summer vibes section", completed: false, assignee: WORKSPACE_MEMBERS[3] },
        { id: "t7", title: "Review with client", completed: false, assignee: WORKSPACE_MEMBERS[1] },
        { id: "t8", title: "Collect reference images", completed: true },
        { id: "t9", title: "Create mood categories", completed: false, assignee: WORKSPACE_MEMBERS[4] },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=200&fit=crop",
      ],
    },
  },
  {
    id: "file-4",
    type: "file",
    position: { x: 100, y: 350 },
    data: {
      label: "Client Presentation",
      fileName: "Client Presentation.pptx",
      product: "atlas",
      status: "in-review",
      fileExtension: ".pptx",
      lastModified: "Updated 1 day ago",
      tasks: [
        { id: "t10", title: "Add case studies", completed: false, assignee: WORKSPACE_MEMBERS[0] },
        { id: "t11", title: "Include pricing slide", completed: false },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop",
      ],
    },
  },
  {
    id: "file-5",
    type: "file",
    position: { x: 1000, y: 200 },
    data: {
      label: "Hero Photography",
      fileName: "Hero Photography.psd",
      product: "synthesis",
      status: "draft",
      fileExtension: ".psd",
      lastModified: "Updated today",
      tasks: [],
      previewImages: [
        "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1516796181074-bf453fbfa3e6?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      ],
    },
  },
  {
    id: "file-6",
    type: "file",
    position: { x: 450, y: 400 },
    data: {
      label: "Feedback Log",
      fileName: "Feedback Log.pdf",
      product: "sage",
      status: "in-review",
      fileExtension: ".pdf",
      lastModified: "Updated 3 days ago",
      tasks: [
        { id: "t12", title: "Incorporate client notes", completed: false, assignee: WORKSPACE_MEMBERS[2] },
        { id: "t13", title: "Archive resolved items", completed: true, assignee: WORKSPACE_MEMBERS[3] },
        { id: "t14", title: "Schedule review meeting", completed: false },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop",
      ],
    },
  },
  {
    id: "file-7",
    type: "file",
    position: { x: 750, y: 450 },
    data: {
      label: "Social Templates",
      fileName: "Social Templates.fig",
      product: "atlas",
      status: "approved",
      fileExtension: ".fig",
      lastModified: "Updated 5 days ago",
      tasks: [
        { id: "t15", title: "Add Instagram stories", completed: true, assignee: WORKSPACE_MEMBERS[4] },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=200&h=200&fit=crop",
      ],
    },
  },
  {
    id: "file-8",
    type: "file",
    position: { x: 1050, y: 500 },
    data: {
      label: "Brand Video",
      fileName: "Brand Video.mp4",
      product: "sage",
      status: "draft",
      fileExtension: ".mp4",
      lastModified: "Updated 6 days ago",
      tasks: [
        { id: "t16", title: "Color grade footage", completed: false, assignee: WORKSPACE_MEMBERS[1] },
        { id: "t17", title: "Add background music", completed: false },
      ],
      previewImages: [
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=200&fit=crop",
      ],
    },
  },
];

// Initial edges
export const INITIAL_EDGES: Edge[] = [
  { id: "e1", source: "file-1", target: "file-2", type: "default", animated: true },
  { id: "e2", source: "file-2", target: "file-3", type: "default", animated: true },
  { id: "e3", source: "file-3", target: "file-5", type: "default", animated: true },
  { id: "e4", source: "file-6", target: "file-3", type: "default", animated: true },
  { id: "e5", source: "file-4", target: "file-1", type: "default", animated: true },
  { id: "e6", source: "file-7", target: "file-3", type: "default", animated: true },
];

// File type to category mapping
export const FILE_TYPE_CATEGORIES: Record<FileTypeCategory, { label: string; extensions: FileExtension[] }> = {
  design: { label: "Design File", extensions: [".fig", ".psd", ".ai"] },
  document: { label: "Document", extensions: [".pdf", ".pptx"] },
  video: { label: "Video", extensions: [".mp4"] },
  image: { label: "Image", extensions: [".psd"] },
  brand: { label: "Brand Asset", extensions: [".ai", ".indd"] },
};
