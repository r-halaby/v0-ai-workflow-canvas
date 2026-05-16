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

### Canvas Actions
- **createStatusPills**: Add visual status indicators to the canvas
- **createTextNote**: Add text notes/documentation to the canvas
- **suggestWorkflow**: Suggest workflow stages for a project type

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
