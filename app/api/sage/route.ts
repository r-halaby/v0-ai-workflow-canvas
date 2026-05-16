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
  // P1 TOOLS - Advanced Reasoning & Analysis
  // ============================================================================
  
  detectConflict: tool({
    description: `Analyze two specific feedback items to detect and explain conflicts between them. Use this when you need to understand why two pieces of feedback might be in tension, or when a user asks about conflicting requirements.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      feedbackIdA: z.string().describe("ID of the first feedback item"),
      feedbackIdB: z.string().describe("ID of the second feedback item"),
    }),
    execute: async ({ projectId, feedbackIdA, feedbackIdB }) => {
      const state = getOrCreateProjectState(projectId);
      
      const feedbackA = state.feedback.find(f => f.id === feedbackIdA);
      const feedbackB = state.feedback.find(f => f.id === feedbackIdB);
      
      if (!feedbackA || !feedbackB) {
        return {
          action: "detectConflict",
          error: "One or both feedback items not found",
          hasConflict: false,
        };
      }
      
      // Analyze conflict between the two feedback items
      const textA = feedbackA.rawInput.toLowerCase();
      const textB = feedbackB.rawInput.toLowerCase();
      
      const conflictIndicators: string[] = [];
      let conflictScore = 0;
      
      // Check for opposing directives
      const opposingPairs = [
        ["more", "less"],
        ["add", "remove"],
        ["bigger", "smaller"],
        ["simpler", "complex"],
        ["bold", "subtle"],
        ["bright", "dark"],
        ["modern", "classic"],
        ["minimal", "detailed"],
        ["faster", "slower"],
        ["include", "exclude"],
      ];
      
      for (const [wordA, wordB] of opposingPairs) {
        if ((textA.includes(wordA) && textB.includes(wordB)) ||
            (textA.includes(wordB) && textB.includes(wordA))) {
          conflictIndicators.push(`Opposing direction: "${wordA}" vs "${wordB}"`);
          conflictScore += 25;
        }
      }
      
      // Check for negation patterns
      if ((textA.includes("not") && !textB.includes("not")) ||
          (!textA.includes("not") && textB.includes("not"))) {
        if (feedbackA.type === feedbackB.type) {
          conflictIndicators.push("Negation conflict on same topic");
          conflictScore += 20;
        }
      }
      
      // Check for different stakeholder priorities
      if (feedbackA.reviewerRole !== feedbackB.reviewerRole) {
        conflictIndicators.push(`Different perspectives: ${feedbackA.reviewerRole} vs ${feedbackB.reviewerRole}`);
        conflictScore += 10;
      }
      
      const hasConflict = conflictScore >= 25;
      
      // Update conflict flags if conflict detected
      if (hasConflict) {
        if (!feedbackA.conflictsWith?.includes(feedbackIdB)) {
          feedbackA.conflictFlag = true;
          feedbackA.conflictsWith = [...(feedbackA.conflictsWith || []), feedbackIdB];
        }
        if (!feedbackB.conflictsWith?.includes(feedbackIdA)) {
          feedbackB.conflictFlag = true;
          feedbackB.conflictsWith = [...(feedbackB.conflictsWith || []), feedbackIdA];
        }
        state.conflictCount = state.feedback.filter(f => f.conflictFlag && !f.resolvedAt).length;
        updateProjectState(state);
      }
      
      return {
        action: "detectConflict",
        feedbackA: { id: feedbackIdA, text: feedbackA.rawInput, role: feedbackA.reviewerRole, type: feedbackA.type },
        feedbackB: { id: feedbackIdB, text: feedbackB.rawInput, role: feedbackB.reviewerRole, type: feedbackB.type },
        hasConflict,
        conflictScore,
        conflictIndicators,
        recommendation: hasConflict 
          ? "Consider scheduling a stakeholder alignment meeting to resolve these conflicting requirements."
          : "These feedback items appear compatible.",
        summary: hasConflict
          ? `Conflict detected (score: ${conflictScore}/100): ${conflictIndicators.join(", ")}`
          : "No significant conflict detected between these feedback items",
      };
    },
  }),
  
  resolveFeedback: tool({
    description: `Mark feedback as resolved with an optional resolution note. Use this when feedback has been addressed through a decision, design change, or stakeholder conversation.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      feedbackId: z.string().describe("ID of the feedback to resolve"),
      resolution: z.string().describe("How the feedback was addressed"),
      linkedDecisionId: z.string().optional().describe("ID of a decision that resolved this feedback"),
    }),
    execute: async ({ projectId, feedbackId, resolution, linkedDecisionId }) => {
      const state = getOrCreateProjectState(projectId);
      
      const feedback = state.feedback.find(f => f.id === feedbackId);
      if (!feedback) {
        return {
          action: "resolveFeedback",
          error: "Feedback not found",
          resolved: false,
        };
      }
      
      if (feedback.resolvedAt) {
        return {
          action: "resolveFeedback",
          feedbackId,
          alreadyResolved: true,
          resolvedAt: feedback.resolvedAt,
          resolution: feedback.resolution,
          summary: "This feedback was already resolved",
        };
      }
      
      feedback.resolvedAt = new Date().toISOString();
      feedback.resolution = linkedDecisionId 
        ? `${resolution} (Decision: ${linkedDecisionId})`
        : resolution;
      
      state.unresolvedFeedbackCount = Math.max(0, state.unresolvedFeedbackCount - 1);
      if (feedback.conflictFlag) {
        state.conflictCount = Math.max(0, state.conflictCount - 1);
      }
      
      updateProjectState(state);
      
      return {
        action: "resolveFeedback",
        feedbackId,
        resolved: true,
        resolution: feedback.resolution,
        remainingUnresolved: state.unresolvedFeedbackCount,
        remainingConflicts: state.conflictCount,
        summary: `Feedback resolved. ${state.unresolvedFeedbackCount} feedback items remaining.`,
      };
    },
  }),
  
  listFeedback: tool({
    description: `Get all feedback for a project, optionally filtered by status or type. Use this to review outstanding feedback or analyze feedback patterns.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      filter: z.enum(["all", "unresolved", "conflicts", "resolved"]).default("all").describe("Filter feedback by status"),
      type: z.string().optional().describe("Filter by feedback type"),
    }),
    execute: async ({ projectId, filter, type }) => {
      const state = getOrCreateProjectState(projectId);
      
      let filtered = state.feedback;
      
      if (filter === "unresolved") {
        filtered = filtered.filter(f => !f.resolvedAt);
      } else if (filter === "resolved") {
        filtered = filtered.filter(f => f.resolvedAt);
      } else if (filter === "conflicts") {
        filtered = filtered.filter(f => f.conflictFlag && !f.resolvedAt);
      }
      
      if (type) {
        filtered = filtered.filter(f => f.type === type);
      }
      
      return {
        action: "listFeedback",
        projectId,
        filter,
        type: type || "all",
        totalCount: state.feedback.length,
        filteredCount: filtered.length,
        feedback: filtered.map(f => ({
          id: f.id,
          type: f.type,
          rawInput: f.rawInput.substring(0, 100) + (f.rawInput.length > 100 ? "..." : ""),
          reviewerRole: f.reviewerRole,
          actionabilityScore: f.actionabilityScore,
          conflictFlag: f.conflictFlag,
          resolved: !!f.resolvedAt,
          createdAt: f.createdAt,
        })),
        summary: `Found ${filtered.length} feedback items (${filter}${type ? `, type: ${type}` : ""})`,
      };
    },
  }),
  
  listDecisions: tool({
    description: `Get all decisions logged for a project. Use this to review the decision history or find decisions related to specific topics.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      limit: z.number().optional().describe("Maximum number of decisions to return"),
      tag: z.string().optional().describe("Filter by tag"),
    }),
    execute: async ({ projectId, limit, tag }) => {
      const state = getOrCreateProjectState(projectId);
      
      let decisions = state.decisions;
      
      if (tag) {
        decisions = decisions.filter(d => d.tags?.includes(tag));
      }
      
      if (limit) {
        decisions = decisions.slice(-limit);
      }
      
      return {
        action: "listDecisions",
        projectId,
        totalCount: state.decisions.length,
        returnedCount: decisions.length,
        decisions: decisions.map(d => ({
          id: d.id,
          decision: d.decision,
          rationale: d.rationale.substring(0, 100) + (d.rationale.length > 100 ? "..." : ""),
          tags: d.tags,
          feedbackAddressed: d.relatedFeedbackIds?.length || 0,
          createdAt: d.createdAt,
        })),
        summary: `Found ${decisions.length} decision${decisions.length !== 1 ? "s" : ""}${tag ? ` with tag "${tag}"` : ""}`,
      };
    },
  }),
  
  // ============================================================================
  // P2 TOOLS - Brief Generation & Reporting
  // ============================================================================
  
  generateBrief: tool({
    description: `Generate a comprehensive project brief document from the project's intent, decisions, and feedback. Use this when a user wants to create a summary document, hand off to a new team member, or document the project state for reference.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
      includeDecisions: z.boolean().default(true).describe("Include decision log in the brief"),
      includeFeedback: z.boolean().default(true).describe("Include feedback summary in the brief"),
      includeMetrics: z.boolean().default(true).describe("Include health metrics in the brief"),
      format: z.enum(["markdown", "structured"]).default("markdown").describe("Output format"),
    }),
    execute: async ({ projectId, includeDecisions, includeFeedback, includeMetrics, format }) => {
      const state = getOrCreateProjectState(projectId);
      
      const now = new Date().toISOString();
      const briefId = `brief-${projectId}-${Date.now()}`;
      
      // Build brief sections
      const sections: Array<{ title: string; content: string }> = [];
      
      // Intent Section
      if (state.intent) {
        sections.push({
          title: "Project Intent",
          content: state.intent.statement,
        });
        
        if (state.intent.revisionHistory.length > 0) {
          sections.push({
            title: "Intent Evolution",
            content: state.intent.revisionHistory
              .map((rev, i) => `Revision ${i + 1}: ${rev.statement}${rev.reason ? ` (Reason: ${rev.reason})` : ""}`)
              .join("\n"),
          });
        }
      }
      
      // Health Metrics Section
      if (includeMetrics) {
        const healthStatus = 
          state.currentDriftScore >= 80 ? "Healthy" :
          state.currentDriftScore >= 60 ? "Needs Attention" :
          state.currentDriftScore >= 40 ? "At Risk" : "Critical";
        
        sections.push({
          title: "Project Health",
          content: [
            `Alignment Score: ${state.currentDriftScore}/100 (${healthStatus})`,
            `Unresolved Feedback: ${state.unresolvedFeedbackCount}`,
            `Active Conflicts: ${state.conflictCount}`,
            `Total Decisions: ${state.decisions.length}`,
            `Total Feedback: ${state.feedback.length}`,
          ].join("\n"),
        });
      }
      
      // Decisions Section
      if (includeDecisions && state.decisions.length > 0) {
        sections.push({
          title: "Key Decisions",
          content: state.decisions
            .map((d, i) => `${i + 1}. ${d.decision}\n   Rationale: ${d.rationale}`)
            .join("\n\n"),
        });
      }
      
      // Feedback Summary Section
      if (includeFeedback && state.feedback.length > 0) {
        const feedbackByType: Record<string, number> = {};
        const unresolvedItems: string[] = [];
        const conflicts: string[] = [];
        
        for (const fb of state.feedback) {
          feedbackByType[fb.type] = (feedbackByType[fb.type] || 0) + 1;
          if (!fb.resolvedAt) {
            unresolvedItems.push(`- [${fb.type}] ${fb.rawInput.substring(0, 80)}... (${fb.reviewerRole})`);
          }
          if (fb.conflictFlag && !fb.resolvedAt) {
            conflicts.push(`- ${fb.rawInput.substring(0, 60)}...`);
          }
        }
        
        let feedbackContent = "Feedback by Type:\n";
        for (const [type, count] of Object.entries(feedbackByType)) {
          feedbackContent += `- ${type}: ${count}\n`;
        }
        
        if (unresolvedItems.length > 0) {
          feedbackContent += `\nUnresolved Items (${unresolvedItems.length}):\n${unresolvedItems.slice(0, 5).join("\n")}`;
          if (unresolvedItems.length > 5) {
            feedbackContent += `\n... and ${unresolvedItems.length - 5} more`;
          }
        }
        
        if (conflicts.length > 0) {
          feedbackContent += `\n\nConflicting Feedback (${conflicts.length}):\n${conflicts.slice(0, 3).join("\n")}`;
        }
        
        sections.push({
          title: "Feedback Summary",
          content: feedbackContent,
        });
      }
      
      // Format output
      let briefContent: string;
      if (format === "markdown") {
        briefContent = `# Project Brief\n\nGenerated: ${new Date(now).toLocaleDateString()}\n\n`;
        for (const section of sections) {
          briefContent += `## ${section.title}\n\n${section.content}\n\n`;
        }
      } else {
        briefContent = JSON.stringify({ id: briefId, generatedAt: now, sections }, null, 2);
      }
      
      return {
        action: "generateBrief",
        briefId,
        projectId,
        generatedAt: now,
        format,
        sections: sections.map(s => s.title),
        content: briefContent,
        summary: `Generated project brief with ${sections.length} sections`,
      };
    },
  }),
  
  getDriftReport: tool({
    description: `Generate a detailed drift analysis report showing how the project has evolved relative to its original intent. Use this when a user wants to understand alignment trends or prepare for a stakeholder review.`,
    inputSchema: z.object({
      projectId: z.string().describe("The project/canvas ID"),
    }),
    execute: async ({ projectId }) => {
      const state = getOrCreateProjectState(projectId);
      
      // Get recent drift history
      const recentDrift = state.driftHistory.slice(-10);
      
      // Calculate trend
      let trend: "improving" | "declining" | "stable" = "stable";
      if (recentDrift.length >= 2) {
        const recent = recentDrift.slice(-3);
        const avgDelta = recent.reduce((sum, d) => sum + d.delta, 0) / recent.length;
        if (avgDelta > 2) trend = "improving";
        else if (avgDelta < -2) trend = "declining";
      }
      
      // Identify risk factors
      const riskFactors: string[] = [];
      if (state.unresolvedFeedbackCount > 3) {
        riskFactors.push(`High unresolved feedback (${state.unresolvedFeedbackCount} items)`);
      }
      if (state.conflictCount > 0) {
        riskFactors.push(`Active conflicts (${state.conflictCount})`);
      }
      if (!state.intent) {
        riskFactors.push("No project intent defined");
      }
      if (state.decisions.length === 0) {
        riskFactors.push("No decisions logged");
      }
      const daysSinceDecision = state.decisions.length > 0 
        ? Math.floor((Date.now() - new Date(state.decisions[state.decisions.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      if (daysSinceDecision !== null && daysSinceDecision > 7) {
        riskFactors.push(`No recent decisions (${daysSinceDecision} days)`);
      }
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (!state.intent) {
        recommendations.push("Define a clear project intent to establish alignment baseline");
      }
      if (state.conflictCount > 0) {
        recommendations.push("Schedule a stakeholder alignment meeting to resolve conflicts");
      }
      if (state.unresolvedFeedbackCount > 3) {
        recommendations.push("Review and address outstanding feedback items");
      }
      if (trend === "declining") {
        recommendations.push("Revisit recent decisions to ensure alignment with intent");
      }
      
      return {
        action: "getDriftReport",
        projectId,
        currentScore: state.currentDriftScore,
        trend,
        history: recentDrift.map(d => ({
          score: d.score,
          delta: d.delta,
          calculatedAt: d.calculatedAt,
        })),
        riskFactors,
        recommendations,
        summary: `Alignment: ${state.currentDriftScore}/100 (${trend}). ${riskFactors.length} risk factors identified.`,
      };
    },
  }),
  
  // ============================================================================
  // CANVAS MANAGEMENT TOOLS - Create and Navigate Canvases
  // ============================================================================
  
  createNewCanvas: tool({
    description: `Create a new canvas project. Use this when the user wants to start a new canvas, create a new project, or when they ask you to create content that requires a new canvas. After creating, offer to open the canvas.`,
    inputSchema: z.object({
      name: z.string().describe("Name for the new canvas"),
      description: z.string().optional().describe("Optional description for the canvas"),
      projectType: z.enum(["branding", "marketing", "product", "ux", "content", "general"]).optional()
        .describe("Type of project to set up initial workflow stages"),
    }),
    execute: async ({ name, description, projectType }) => {
      const canvasId = `canvas-${Date.now()}`;
      
      // Generate initial nodes based on project type
      const initialNodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: Record<string, unknown>;
      }> = [];
      
      if (projectType) {
        // Add Sage overview node
        initialNodes.push({
          id: `sage-overview-${Date.now()}`,
          type: "sageOverview",
          position: { x: 50, y: 50 },
          data: {
            projectId: canvasId,
            intent: `New ${projectType} project: ${name}`,
            currentDriftScore: 100,
            driftDelta: 0,
            unresolvedFeedbackCount: 0,
            conflictCount: 0,
            recentDecisions: [],
            healthStatus: "healthy",
          },
        });
        
        // Add initial status pills based on project type
        const statusWorkflows: Record<string, Array<{ label: string; color: string }>> = {
          branding: [
            { label: "Discovery", color: "#6B7280" },
            { label: "Concept", color: "#3B82F6" },
            { label: "Design", color: "#8B5CF6" },
            { label: "Refinement", color: "#F59E0B" },
            { label: "Delivery", color: "#10B981" },
          ],
          marketing: [
            { label: "Brief", color: "#6B7280" },
            { label: "Strategy", color: "#3B82F6" },
            { label: "Creative", color: "#8B5CF6" },
            { label: "Review", color: "#F59E0B" },
            { label: "Launch", color: "#10B981" },
          ],
          product: [
            { label: "Research", color: "#6B7280" },
            { label: "Define", color: "#3B82F6" },
            { label: "Design", color: "#8B5CF6" },
            { label: "Validate", color: "#F59E0B" },
            { label: "Ship", color: "#10B981" },
          ],
          ux: [
            { label: "Discover", color: "#6B7280" },
            { label: "Define", color: "#3B82F6" },
            { label: "Ideate", color: "#8B5CF6" },
            { label: "Prototype", color: "#F59E0B" },
            { label: "Test", color: "#10B981" },
          ],
          content: [
            { label: "Plan", color: "#6B7280" },
            { label: "Draft", color: "#3B82F6" },
            { label: "Review", color: "#F59E0B" },
            { label: "Publish", color: "#10B981" },
          ],
          general: [
            { label: "To Do", color: "#6B7280" },
            { label: "In Progress", color: "#3B82F6" },
            { label: "Review", color: "#F59E0B" },
            { label: "Done", color: "#10B981" },
          ],
        };
        
        const workflow = statusWorkflows[projectType] || statusWorkflows.general;
        workflow.forEach((status, index) => {
          initialNodes.push({
            id: `status-${Date.now()}-${index}`,
            type: "statusPill",
            position: { x: 300 + (index * 140), y: 60 },
            data: {
              label: status.label,
              color: status.color,
            },
          });
        });
      }
      
      return {
        action: "createNewCanvas",
        canvasId,
        name,
        description: description || "",
        projectType: projectType || "general",
        initialNodes,
        navigateTo: canvasId,
        summary: `Created new canvas "${name}"${projectType ? ` with ${projectType} workflow` : ""}. Would you like me to open it?`,
      };
    },
  }),
  
  openCanvas: tool({
    description: `Open an existing canvas by ID or name. Use this when the user wants to navigate to a specific canvas or when you've just created a canvas and want to open it.`,
    inputSchema: z.object({
      canvasId: z.string().optional().describe("The ID of the canvas to open"),
      canvasName: z.string().optional().describe("The name of the canvas to search for"),
    }),
    execute: async ({ canvasId, canvasName }) => {
      if (!canvasId && !canvasName) {
        return {
          action: "openCanvas",
          error: "Please provide either a canvas ID or name",
          navigateTo: null,
        };
      }
      
      return {
        action: "openCanvas",
        canvasId: canvasId || null,
        canvasName: canvasName || null,
        navigateTo: canvasId || `search:${canvasName}`,
        summary: canvasId 
          ? `Opening canvas ${canvasId}...`
          : `Searching for canvas "${canvasName}"...`,
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

### Analysis & Resolution (P1 Tools)
- **detectConflict**: Analyze two specific feedback items to understand and explain conflicts
- **resolveFeedback**: Mark feedback as addressed with resolution notes
- **listFeedback**: Get all feedback with filtering (unresolved, conflicts, by type)
- **listDecisions**: Get decision history with optional tag filtering

### Brief Generation & Reporting (P2 Tools)
- **generateBrief**: Create a comprehensive project brief from intent, decisions, and feedback
- **getDriftReport**: Generate detailed alignment analysis with trends and recommendations

### Canvas Management
- **createNewCanvas**: Create a new canvas with optional workflow setup based on project type
- **openCanvas**: Navigate to and open a specific canvas by ID or name

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

### When user wants to CREATE A NEW PROJECT or CANVAS:
1. Use createNewCanvas with appropriate name and project type
2. IMMEDIATELY after creating, call openCanvas with the canvasId returned from createNewCanvas
3. ALWAYS call both tools - first createNewCanvas, then openCanvas
4. Do NOT just say you opened the canvas - you MUST call the openCanvas tool

### When user wants to OPEN or GO TO a canvas:
1. You MUST call the openCanvas tool with the canvas ID or name - do not just say you opened it
2. The UI handles navigation when the tool is called
3. Without calling the tool, the canvas will NOT actually open

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

### When user asks about CONFLICTS:
1. Use listFeedback with filter="conflicts" to see all conflicts
2. Use detectConflict for detailed analysis of specific feedback pairs
3. Recommend resolution strategies

### When user RESOLVES or ADDRESSES feedback:
1. Use resolveFeedback to mark it as addressed
2. Link to any related decision if applicable
3. Report remaining unresolved items

### When user wants to REVIEW history:
1. Use listFeedback or listDecisions to retrieve records
2. Summarize patterns and trends

### When user asks for a BRIEF or SUMMARY document:
1. Use generateBrief to compile project state into a formatted document
2. Include intent, decisions, feedback summary, and health metrics
3. Offer both markdown and structured formats

### When user asks about DRIFT or ALIGNMENT trends:
1. Use getDriftReport for comprehensive analysis
2. Report trend direction, risk factors, and recommendations
3. Suggest actions to improve alignment

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
