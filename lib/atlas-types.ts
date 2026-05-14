import type { Node, Edge } from "@xyflow/react";

// Product types
export type ProductType = "atlas" | "synthesis" | "sage";

// Status types
export type FileStatus = "draft" | "in-review" | "approved";

// File extension types
export type FileExtension = ".fig" | ".psd" | ".pdf" | ".mp4" | ".ai" | ".indd" | ".pptx";

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

// File node data interface
export interface FileNodeData {
  label: string;
  fileName: string;
  product: ProductType;
  status: FileStatus;
  fileExtension: FileExtension;
  lastModified: string;
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
      lastModified: "May 10, 2026",
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
      lastModified: "May 8, 2026",
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
      lastModified: "May 12, 2026",
    },
  },
  {
    id: "file-4",
    type: "file",
    position: { x: 100, y: 300 },
    data: {
      label: "Client Presentation",
      fileName: "Client Presentation.pptx",
      product: "atlas",
      status: "in-review",
      fileExtension: ".pptx",
      lastModified: "May 11, 2026",
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
      lastModified: "May 13, 2026",
    },
  },
  {
    id: "file-6",
    type: "file",
    position: { x: 450, y: 350 },
    data: {
      label: "Feedback Log",
      fileName: "Feedback Log.pdf",
      product: "sage",
      status: "in-review",
      fileExtension: ".pdf",
      lastModified: "May 9, 2026",
    },
  },
  {
    id: "file-7",
    type: "file",
    position: { x: 750, y: 400 },
    data: {
      label: "Social Templates",
      fileName: "Social Templates.fig",
      product: "atlas",
      status: "approved",
      fileExtension: ".fig",
      lastModified: "May 7, 2026",
    },
  },
  {
    id: "file-8",
    type: "file",
    position: { x: 1050, y: 450 },
    data: {
      label: "Brand Video",
      fileName: "Brand Video.mp4",
      product: "sage",
      status: "draft",
      fileExtension: ".mp4",
      lastModified: "May 6, 2026",
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
