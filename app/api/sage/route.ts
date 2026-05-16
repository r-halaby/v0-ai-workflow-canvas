import { streamText, tool, convertToModelMessages, stepCountIs, generateObject } from "ai";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { FeedbackType, ProjectType, SageProjectState } from "@/lib/atlas-types";
import { STATUS_WORKFLOWS } from "@/lib/atlas-types";
import {
  createIntent,
  updateIntent,
  createDecision,
  createFeedbackRecord,
  createStatusSet,
  calculateDrift,
  createInitialSageState,
  aggregateSageState,
} from "@/lib/sage-state";

export const maxDuration = 30;

// In-memory state store (in production, this would be a database)
// Key: projectId, Value: SageProjectState
const projectStates = new Map<string, SageProjectState>();

function getOrCreateProjectState(projectId: string): SageProjectState {
  if (!projectStates.has(projectId)) {
    projectStates.set(projectId, createInitialSageState(projectId));
  }
  return projectStates.get(projectId)!;
}

function updateProjectState(state: SageProjectState): void {
  state.lastUpdated = new Date().toISOString();
  projectStates.set(state.projectId, state);
}

// Define tools that Sage can use to interact with the canvas
const sageTools = {
  // ============================================================================
  // P0 REASONING TOOLS - Core Sage Intelligence
  // ============================================================================
  
  classifyFeedback: tool({
    description: `Classify stakeholder feedback using the Discern taxonomy. Use this when a user shares feedback they received from clients, stakeholders, or team members. The tool analyzes the feedback and returns:
- Type classification (aesthetic-preference, functional-requirement, strategic-direction, technical-constraint, clarification-request, approval, revision-request)
- Actionability score (0-100)
- Conflict detection with existing feedback`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      feedback: z.string().describe("The raw feedback text to classify"),
      reviewerRole: z.string().describe("Role of the person who gave feedback (e.g., 'Creative Director', 'Client', 'Developer')"),
      source: z.enum(["stakeholder", "client", "internal", "sage"]).default("stakeholder"),
    }),
    execute: async ({ projectId, feedback, reviewerRole, source }) => {
      // Use AI to classify the feedback
      const feedbackTypes: FeedbackType[] = [
        "aesthetic-preference",
        "functional-requirement", 
        "strategic-direction",
        "technical-constraint",
        "clarification-request",
        "approval",
        "revision-request",
      ];
      
      // Simple keyword-based classification (in production, use AI inference)
      let type: FeedbackType = "revision-request";
      let actionabilityScore = 50;
      
      const lowerFeedback = feedback.toLowerCase();
      
      if (lowerFeedback.includes("approve") || lowerFeedback.includes("looks good") || lowerFeedback.includes("sign off")) {
        type = "approval";
        actionabilityScore = 90;
      } else if (lowerFeedback.includes("color") || lowerFeedback.includes("font") || lowerFeedback.includes("style") || lowerFeedback.includes("look") || lowerFeedback.includes("feel")) {
        type = "aesthetic-preference";
        actionabilityScore = 70;
      } else if (lowerFeedback.includes("must") || lowerFeedback.includes("need") || lowerFeedback.includes("require") || lowerFeedback.includes("function")) {
        type = "functional-requirement";
        actionabilityScore = 85;
      } else if (lowerFeedback.includes("strategy") || lowerFeedback.includes("brand") || lowerFeedback.includes("position") || lowerFeedback.includes("message")) {
        type = "strategic-direction";
        actionabilityScore = 75;
      } else if (lowerFeedback.includes("technical") || lowerFeedback.includes("constraint") || lowerFeedback.includes("limitation") || lowerFeedback.includes("can't")) {
        type = "technical-constraint";
        actionabilityScore = 80;
      } else if (lowerFeedback.includes("?") || lowerFeedback.includes("what") || lowerFeedback.includes("how") || lowerFeedback.includes("clarify")) {
        type = "clarification-request";
        actionabilityScore = 60;
      }
      
      // Get current state and check for conflicts
      const state = getOrCreateProjectState(projectId);
      const existingFeedback = state.feedback;
      
      // Simple conflict detection - check for opposing sentiments
      let conflictsWith: string[] = [];
      for (const existing of existingFeedback) {
        if (!existing.resolvedAt && existing.type === type) {
          // Check for potential conflict keywords
          const hasOpposingView = 
            (lowerFeedback.includes("not") && !existing.rawInput.toLowerCase().includes("not")) ||
            (lowerFeedback.includes("remove") && existing.rawInput.toLowerCase().includes("add")) ||
            (lowerFeedback.includes("simpler") && existing.rawInput.toLowerCase().includes("more"));
          if (hasOpposingView) {
            conflictsWith.push(existing.id);
          }
        }
      }
      
      // Create and store the feedback record
      const record = createFeedbackRecord(projectId, feedback, type, reviewerRole, source, actionabilityScore);
      if (conflictsWith.length > 0) {
        record.conflictFlag = true;
        record.conflictsWith = conflictsWith;
      }
      
      state.feedback.push(record);
      state.unresolvedFeedbackCount++;
      if (record.conflictFlag) state.conflictCount++;
      updateProjectState(state);
      
      return {
        action: "classifyFeedback",
        feedbackId: record.id,
        type,
        actionabilityScore,
        conflictFlag: record.conflictFlag,
        conflictsWith: conflictsWith.length > 0 ? conflictsWith : undefined,
        summary: `Classified as "${type}" with ${actionabilityScore}% actionability${conflictsWith.length > 0 ? `. Conflicts detected with ${conflictsWith.length} existing feedback item(s)` : ""}`,
      };
    },
  }),
  
  updateIntent: tool({
    description: `Set or update the project intent - the guiding "north star" statement for the project. Use this when a user defines what their project is about, updates the project direction, or when you need to capture the core purpose after a conversation. The intent helps measure drift and keep the project aligned.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      statement: z.string().describe("The intent statement describing the project's core purpose and goals"),
      reason: z.string().optional().describe("Reason for updating the intent (if updating existing)"),
    }),
    execute: async ({ projectId, statement, reason }) => {
      const state = getOrCreateProjectState(projectId);
      
      if (state.intent) {
        // Update existing intent
        state.intent = updateIntent(state.intent, statement, "user", reason);
      } else {
        // Create new intent
        state.intent = createIntent(projectId, statement, "user");
      }
      
      updateProjectState(state);
      
      return {
        action: "updateIntent",
        intentId: state.intent.id,
        statement: state.intent.statement,
        isUpdate: state.intent.revisionHistory.length > 0,
        revisionCount: state.intent.revisionHistory.length,
        summary: state.intent.revisionHistory.length > 0 
          ? `Updated project intent (revision ${state.intent.revisionHistory.length})`
          : "Set initial project intent",
      };
    },
  }),
  
  logDecision: tool({
    description: `Log an immutable project decision with rationale. Use this when a significant decision is made about the project direction, design choices, or scope changes. Decisions are linked to feedback when relevant and cannot be edited after creation.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      decision: z.string().describe("What was decided"),
      rationale: z.string().describe("Why this decision was made"),
      relatedFeedbackIds: z.array(z.string()).optional().describe("IDs of feedback that informed this decision"),
      tags: z.array(z.string()).optional().describe("Tags for categorizing the decision"),
    }),
    execute: async ({ projectId, decision, rationale, relatedFeedbackIds, tags }) => {
      const state = getOrCreateProjectState(projectId);
      
      const decisionRecord = createDecision(projectId, decision, rationale, "user", relatedFeedbackIds, tags);
      state.decisions.push(decisionRecord);
      
      // Mark related feedback as addressed
      if (relatedFeedbackIds) {
        for (const fbId of relatedFeedbackIds) {
          const fb = state.feedback.find(f => f.id === fbId);
          if (fb && !fb.resolvedAt) {
            fb.resolvedAt = new Date().toISOString();
            fb.resolution = `Addressed by decision: ${decisionRecord.id}`;
            state.unresolvedFeedbackCount--;
            if (fb.conflictFlag) state.conflictCount--;
          }
        }
      }
      
      updateProjectState(state);
      
      return {
        action: "logDecision",
        decisionId: decisionRecord.id,
        decision,
        rationale,
        feedbackAddressed: relatedFeedbackIds?.length || 0,
        totalDecisions: state.decisions.length,
        summary: `Decision logged${relatedFeedbackIds?.length ? `, addressing ${relatedFeedbackIds.length} feedback item(s)` : ""}`,
      };
    },
  }),
  
  getProjectState: tool({
    description: `Get the current Sage state for a project including intent, decisions, feedback, and health metrics. Use this to understand the current state of a project before making recommendations or when the user asks about project health.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
    }),
    execute: async ({ projectId }) => {
      const state = getOrCreateProjectState(projectId);
      
      // Calculate current drift
      const driftRecord = calculateDrift(
        projectId,
        state.intent,
        state.decisions,
        state.feedback,
        state.currentDriftScore
      );
      state.driftHistory.push(driftRecord);
      state.currentDriftScore = driftRecord.score;
      updateProjectState(state);
      
      // Determine health status
      let healthStatus: "healthy" | "needs-attention" | "at-risk" | "critical" = "healthy";
      if (state.conflictCount > 3 || driftRecord.score < 40) healthStatus = "critical";
      else if (state.conflictCount > 1 || driftRecord.score < 60 || state.unresolvedFeedbackCount > 5) healthStatus = "at-risk";
      else if (state.unresolvedFeedbackCount > 2 || driftRecord.score < 80) healthStatus = "needs-attention";
      
      return {
        action: "getProjectState",
        projectId,
        hasIntent: !!state.intent,
        intentStatement: state.intent?.statement,
        decisionCount: state.decisions.length,
        feedbackCount: state.feedback.length,
        unresolvedFeedbackCount: state.unresolvedFeedbackCount,
        conflictCount: state.conflictCount,
        driftScore: driftRecord.score,
        driftDelta: driftRecord.delta,
        driftFactors: driftRecord.factors.map(f => `${f.name}: ${f.score}/100`),
        healthStatus,
        lastDecision: state.decisions[state.decisions.length - 1]?.decision,
        summary: `Project health: ${healthStatus.toUpperCase()} | Drift: ${driftRecord.score}/100 | ${state.unresolvedFeedbackCount} unresolved feedback | ${state.conflictCount} conflicts`,
      };
    },
  }),
  
  createProjectStatusSet: tool({
    description: `Create a status workflow for a project based on its type. Use this when setting up a new project or when the user wants predefined workflow stages. Available project types: brand-identity, editorial, product-design, environmental, motion, web-design, packaging, custom.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      projectType: z.enum(["brand-identity", "editorial", "product-design", "environmental", "motion", "web-design", "packaging", "custom"])
        .describe("The type of project to create statuses for"),
    }),
    execute: async ({ projectId, projectType }) => {
      const state = getOrCreateProjectState(projectId);
      
      const statusSet = createStatusSet(projectId, projectType as ProjectType);
      state.statusSet = statusSet;
      updateProjectState(state);
      
      return {
        action: "createProjectStatusSet",
        statusSetId: statusSet.id,
        projectType,
        statuses: statusSet.statuses.map(s => ({ label: s.label, color: s.color })),
        summary: `Created ${statusSet.statuses.length}-stage workflow for ${projectType} project`,
      };
    },
  }),
  
  // ============================================================================
  // CANVAS TOOLS - Visual Node Creation
  // ============================================================================
  
  createStatusPills: tool({
    description: "Create one or more status pill nodes on the canvas. Use this when the user asks you to create statuses, labels, tags, or workflow stages for their project.",
    inputSchema: z.object({
      pills: z.array(z.object({
        label: z.string().describe("The text label for the status pill"),
        color: z.enum(["gray", "blue", "green", "yellow", "orange", "red", "purple", "pink"])
          .describe("The color of the status pill"),
      })).describe("Array of status pills to create"),
      arrangement: z.enum(["horizontal", "vertical", "grid"])
        .describe("How to arrange the pills on the canvas"),
    }),
    execute: async ({ pills, arrangement }) => {
      // Return the data - the client will handle actually creating the nodes
      return {
        action: "createStatusPills",
        pills: pills.map((pill, index) => ({
          ...pill,
          color: getColorHex(pill.color),
          index,
        })),
        arrangement: arrangement || "horizontal",
      };
    },
  }),
  createTextNote: tool({
    description: "Create a text note on the canvas. Use this for adding descriptions, instructions, or documentation.",
    inputSchema: z.object({
      title: z.string().describe("The title of the note"),
      content: z.string().describe("The content/body of the note"),
    }),
    execute: async ({ title, content }) => {
      return {
        action: "createTextNote",
        title,
        content,
      };
    },
  }),
  suggestWorkflow: tool({
    description: "Suggest a workflow or set of statuses for a project type. Use this when the user asks for suggestions or recommendations for organizing their project.",
    inputSchema: z.object({
      projectType: z.string().describe("The type of project (e.g., branding, web design, video production)"),
    }),
    execute: async ({ projectType }) => {
      // Generate appropriate statuses based on project type
      const workflows: Record<string, Array<{ label: string; color: string }>> = {
        branding: [
          { label: "Discovery", color: "#93c5fd" },
          { label: "Research", color: "#c4b5fd" },
          { label: "Concepts", color: "#fde047" },
          { label: "Refinement", color: "#fdba74" },
          { label: "Final", color: "#86efac" },
          { label: "Delivered", color: "#e5e5e5" },
        ],
        "web design": [
          { label: "Wireframes", color: "#e5e5e5" },
          { label: "Mockups", color: "#93c5fd" },
          { label: "Prototype", color: "#c4b5fd" },
          { label: "Development", color: "#fde047" },
          { label: "Testing", color: "#fdba74" },
          { label: "Live", color: "#86efac" },
        ],
        "video production": [
          { label: "Pre-production", color: "#93c5fd" },
          { label: "Scripting", color: "#c4b5fd" },
          { label: "Filming", color: "#fde047" },
          { label: "Editing", color: "#fdba74" },
          { label: "Review", color: "#fca5a5" },
          { label: "Final Cut", color: "#86efac" },
        ],
        default: [
          { label: "To Do", color: "#e5e5e5" },
          { label: "In Progress", color: "#93c5fd" },
          { label: "Review", color: "#fde047" },
          { label: "Done", color: "#86efac" },
        ],
      };

      const normalizedType = projectType.toLowerCase();
      const matchedWorkflow = workflows[normalizedType] || workflows.default;

      return {
        action: "suggestWorkflow",
        projectType,
        suggestion: matchedWorkflow,
      };
    },
  }),
  
  // ============================================================================
  // P0 CANVAS AGENT TOOLS - Advanced Node Creation
  // ============================================================================
  
  parseFileToNodes: tool({
    description: `Parse an uploaded file (PDF, text document, brief) into structured text nodes on the canvas. Use this when a user uploads a document and wants to extract its content into organized nodes. The tool extracts sections from the document and creates a text node for each section, automatically grouping them with the filename as the group label.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      fileName: z.string().describe("The name of the uploaded file"),
      fileContent: z.string().describe("The text content extracted from the file"),
      startPosition: z.object({
        x: z.number().describe("X coordinate for the first node"),
        y: z.number().describe("Y coordinate for the first node"),
      }).optional().describe("Starting position for nodes (defaults to auto-calculate)"),
    }),
    execute: async ({ projectId, fileName, fileContent, startPosition }) => {
      // Parse content into sections
      // Look for common section patterns: headers, numbered sections, blank line separators
      const sections: Array<{ title: string; content: string }> = [];
      
      // Split by common section patterns
      const lines = fileContent.split('\n');
      let currentSection: { title: string; content: string[] } | null = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Detect section headers (numbered, ALL CAPS, or with colons)
        const isHeader = 
          /^[0-9]+[\.\)]\s+[A-Z]/.test(trimmedLine) || // "1. Section" or "1) Section"
          /^[A-Z][A-Z\s]{3,}$/.test(trimmedLine) || // "ALL CAPS HEADER"
          /^#+\s+/.test(trimmedLine) || // "# Markdown Header"
          /^[A-Z][a-z]+:$/.test(trimmedLine); // "Title:"
        
        if (isHeader && trimmedLine.length > 2) {
          // Save previous section
          if (currentSection && currentSection.content.length > 0) {
            sections.push({
              title: currentSection.title,
              content: currentSection.content.join('\n').trim(),
            });
          }
          // Start new section
          currentSection = {
            title: trimmedLine.replace(/^#+\s+/, '').replace(/:$/, ''),
            content: [],
          };
        } else if (currentSection) {
          currentSection.content.push(line);
        } else if (trimmedLine.length > 0) {
          // No section yet, create initial section
          currentSection = {
            title: 'Overview',
            content: [line],
          };
        }
      }
      
      // Don't forget the last section
      if (currentSection && currentSection.content.length > 0) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n').trim(),
        });
      }
      
      // If no sections found, create one from entire content
      if (sections.length === 0) {
        sections.push({
          title: fileName.replace(/\.[^.]+$/, ''), // Remove extension
          content: fileContent.trim(),
        });
      }
      
      // Calculate positions with collision avoidance
      const baseX = startPosition?.x ?? 100;
      const baseY = startPosition?.y ?? 100;
      const nodeWidth = 280;
      const nodeHeight = 200;
      const gap = 24;
      const nodesPerRow = 3;
      
      const nodes = sections.map((section, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;
        
        return {
          id: `node-${projectId}-${Date.now()}-${index}`,
          title: section.title,
          content: section.content,
          position: {
            x: baseX + col * (nodeWidth + gap),
            y: baseY + row * (nodeHeight + gap),
          },
        };
      });
      
      // Create group for all nodes
      const groupId = `group-${projectId}-${Date.now()}`;
      
      return {
        action: "parseFileToNodes",
        projectId,
        fileName,
        groupId,
        groupLabel: fileName.replace(/\.[^.]+$/, ''), // Remove extension for label
        nodes,
        nodeCount: nodes.length,
        summary: `Extracted ${nodes.length} sections from "${fileName}" and grouped them together`,
      };
    },
  }),
  
  createTextNodeWithPosition: tool({
    description: `Create a single text node at a specific position on the canvas with collision avoidance. Use this when you need to place a text note at a precise location, or when creating nodes that should avoid overlapping with existing content.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      title: z.string().describe("The title of the text node"),
      content: z.string().describe("The content/body of the text node"),
      position: z.object({
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
      }).optional().describe("Position for the node (auto-calculates if not provided)"),
      existingNodePositions: z.array(z.object({
        x: z.number(),
        y: z.number(),
        width: z.number().default(280),
        height: z.number().default(200),
      })).optional().describe("Positions of existing nodes to avoid collision"),
      sourceFile: z.string().optional().describe("Source file this node came from, if any"),
    }),
    execute: async ({ projectId, title, content, position, existingNodePositions, sourceFile }) => {
      const nodeWidth = 280;
      const nodeHeight = 200;
      const gap = 24;
      
      let finalPosition = position || { x: 100, y: 100 };
      
      // Collision avoidance if existing positions provided
      if (existingNodePositions && existingNodePositions.length > 0 && !position) {
        // Find a free spot by checking grid positions
        let found = false;
        for (let row = 0; row < 10 && !found; row++) {
          for (let col = 0; col < 5 && !found; col++) {
            const testX = 100 + col * (nodeWidth + gap);
            const testY = 100 + row * (nodeHeight + gap);
            
            // Check if this position overlaps with any existing node
            const overlaps = existingNodePositions.some(existing => {
              return !(
                testX + nodeWidth < existing.x ||
                testX > existing.x + existing.width ||
                testY + nodeHeight < existing.y ||
                testY > existing.y + existing.height
              );
            });
            
            if (!overlaps) {
              finalPosition = { x: testX, y: testY };
              found = true;
            }
          }
        }
      }
      
      const nodeId = `node-${projectId}-${Date.now()}`;
      
      return {
        action: "createTextNodeWithPosition",
        projectId,
        nodeId,
        title,
        content,
        position: finalPosition,
        sourceFile,
        summary: `Created text node "${title}" at position (${finalPosition.x}, ${finalPosition.y})`,
      };
    },
  }),
  
  groupNodes: tool({
    description: `Group multiple nodes together with an optional label. Use this to organize related nodes on the canvas, such as grouping all nodes from a single document or all nodes related to a specific topic.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      nodeIds: z.array(z.string()).describe("IDs of nodes to group together"),
      label: z.string().optional().describe("Label for the group"),
      color: z.string().optional().describe("Background color for the group (hex)"),
    }),
    execute: async ({ projectId, nodeIds, label, color }) => {
      const groupId = `group-${projectId}-${Date.now()}`;
      
      return {
        action: "groupNodes",
        projectId,
        groupId,
        nodeIds,
        label: label || "Group",
        color: color || "#1a1a1a",
        summary: `Grouped ${nodeIds.length} nodes${label ? ` as "${label}"` : ""}`,
      };
    },
  }),
  
  moveNodes: tool({
    description: `Move one or more nodes to new positions on the canvas. Use this for rearranging nodes or organizing the canvas layout.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      moves: z.array(z.object({
        nodeId: z.string().describe("ID of the node to move"),
        position: z.object({
          x: z.number().describe("New X coordinate"),
          y: z.number().describe("New Y coordinate"),
        }),
      })).describe("Array of node movements"),
    }),
    execute: async ({ projectId, moves }) => {
      return {
        action: "moveNodes",
        projectId,
        moves,
        summary: `Moved ${moves.length} node(s) to new positions`,
      };
    },
  }),
  
  connectNodes: tool({
    description: `Create a visual connection/arrow between two nodes on the canvas. Use this to show relationships, dependencies, or flow between nodes.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      sourceNodeId: z.string().describe("ID of the source node (where the arrow starts)"),
      targetNodeId: z.string().describe("ID of the target node (where the arrow ends)"),
      label: z.string().optional().describe("Label for the connection"),
      style: z.enum(["arrow", "line", "dashed"]).default("arrow").describe("Style of the connection"),
    }),
    execute: async ({ projectId, sourceNodeId, targetNodeId, label, style }) => {
      const connectionId = `conn-${projectId}-${Date.now()}`;
      
      return {
        action: "connectNodes",
        projectId,
        connectionId,
        sourceNodeId,
        targetNodeId,
        label,
        style,
        summary: `Created ${style} connection from ${sourceNodeId} to ${targetNodeId}${label ? ` labeled "${label}"` : ""}`,
      };
    },
  }),
  
  arrangeNodes: tool({
    description: `Arrange nodes in a specific layout pattern. Use this to automatically organize nodes in a grid, row, column, or other pattern.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      nodeIds: z.array(z.string()).describe("IDs of nodes to arrange"),
      layout: z.enum(["grid", "row", "column", "circle"]).describe("Layout pattern"),
      startPosition: z.object({
        x: z.number().describe("Starting X coordinate"),
        y: z.number().describe("Starting Y coordinate"),
      }).optional(),
      spacing: z.number().optional().describe("Space between nodes (default 24)"),
    }),
    execute: async ({ projectId, nodeIds, layout, startPosition, spacing = 24 }) => {
      const nodeWidth = 280;
      const nodeHeight = 200;
      const baseX = startPosition?.x ?? 100;
      const baseY = startPosition?.y ?? 100;
      
      const positions: Array<{ nodeId: string; position: { x: number; y: number } }> = [];
      
      nodeIds.forEach((nodeId, index) => {
        let x = baseX;
        let y = baseY;
        
        switch (layout) {
          case "row":
            x = baseX + index * (nodeWidth + spacing);
            y = baseY;
            break;
          case "column":
            x = baseX;
            y = baseY + index * (nodeHeight + spacing);
            break;
          case "grid":
            const cols = Math.ceil(Math.sqrt(nodeIds.length));
            x = baseX + (index % cols) * (nodeWidth + spacing);
            y = baseY + Math.floor(index / cols) * (nodeHeight + spacing);
            break;
          case "circle":
            const radius = Math.max(nodeWidth, nodeHeight) * nodeIds.length / (2 * Math.PI);
            const angle = (index / nodeIds.length) * 2 * Math.PI - Math.PI / 2;
            x = baseX + radius + radius * Math.cos(angle);
            y = baseY + radius + radius * Math.sin(angle);
            break;
        }
        
        positions.push({ nodeId, position: { x, y } });
      });
      
      return {
        action: "arrangeNodes",
        projectId,
        layout,
        positions,
        summary: `Arranged ${nodeIds.length} nodes in ${layout} layout`,
      };
    },
  }),
};

function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    gray: "#e5e5e5",
    blue: "#93c5fd",
    green: "#86efac",
    yellow: "#fde047",
    orange: "#fdba74",
    red: "#fca5a5",
    purple: "#c4b5fd",
    pink: "#f9a8d4",
  };
  return colors[colorName] || colors.gray;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Allow unauthenticated users for demo purposes
    const userId = user?.id || "anonymous";

    const { messages, context } = await req.json();

    // Build system prompt based on context
    let systemPrompt = `You are Sage, an AI assistant for Atlas - a creative asset management and workflow platform.

You are concise, professional, and observational. You help users organize their creative projects and maintain project health through intelligent feedback classification, decision tracking, and drift monitoring.

## YOUR CAPABILITIES

### Project Intelligence (P0 Reasoning)
- **classifyFeedback**: When users share feedback they received, classify it using the Discern taxonomy and detect conflicts
- **updateIntent**: Set or update the project's guiding purpose ("north star")
- **logDecision**: Record significant project decisions with rationale
- **getProjectState**: Check project health, drift score, and metrics
- **createProjectStatusSet**: Create workflow stages based on project type

### Canvas Actions (Basic)
- **createStatusPills**: Add visual status indicators to the canvas
- **createTextNote**: Add text notes/documentation to the canvas
- **suggestWorkflow**: Suggest workflow stages for a project type

### Canvas Agent Tools (Advanced)
- **parseFileToNodes**: Parse uploaded documents into structured text nodes, auto-grouped by filename
- **createTextNodeWithPosition**: Create text nodes with collision avoidance
- **groupNodes**: Group related nodes together with a label
- **moveNodes**: Reposition nodes on the canvas
- **connectNodes**: Draw connections/arrows between nodes
- **arrangeNodes**: Auto-arrange nodes in grid, row, column, or circle layout

## WHEN TO USE REASONING TOOLS

### When user shares FEEDBACK from others:
1. Use classifyFeedback to analyze it
2. Report the classification and actionability score
3. Alert if conflicts are detected with existing feedback

### When user defines PROJECT PURPOSE or GOALS:
1. Use updateIntent to capture the project's north star
2. This helps track drift and maintain alignment

### When user makes a DECISION:
1. Use logDecision to record it with rationale
2. Link to related feedback if applicable

### When user UPLOADS A FILE or DOCUMENT:
1. Use parseFileToNodes to extract structured content
2. The tool auto-groups nodes with the filename as label
3. Report how many sections were extracted

### When user wants to ORGANIZE or ARRANGE nodes:
1. Use arrangeNodes for automatic layouts (grid, row, column, circle)
2. Use groupNodes to group related nodes together
3. Use connectNodes to show relationships between nodes

### When user asks about PROJECT HEALTH or STATUS:
1. Use getProjectState to get current metrics
2. Report drift score, unresolved feedback, and conflicts

## CANVAS WORKFLOW

### When user asks for statuses/workflow stages:
1. DESCRIBE the statuses you recommend
2. Ask if they'd like to modify or add them

### When user CONFIRMS:
IMMEDIATELY call createStatusPills or createProjectStatusSet. Do NOT ask again.

## UX WRITING RULES
- Be observational, not prescriptive
- Present information, let user decide
- Use "I notice..." rather than "You should..."
- Keep responses concise and actionable

## CRITICAL RULES:
- When user confirms, execute the action immediately
- Always report tool results clearly
- Flag conflicts proactively
- Track decisions to reduce drift

Current user: ${userId}
`;

    if (context) {
      if (context.canvasName) {
        systemPrompt += `\nCurrent canvas: ${context.canvasName}`;
      }
      if (context.nodeCount) {
        systemPrompt += `\nNodes on canvas: ${context.nodeCount}`;
      }
      if (context.selectedNode) {
        systemPrompt += `\nSelected node: ${JSON.stringify(context.selectedNode)}`;
      }
    }

    const result = streamText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: sageTools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Sage API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
