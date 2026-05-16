/**
 * Sage State Management
 * 
 * Manages project-level Sage state including:
 * - Project Intent
 * - Decision Log
 * - Feedback Records
 * - Drift Scores
 * - Status Sets
 * 
 * State is stored in-memory with React state management.
 * For persistence, this would integrate with a database.
 */

import type {
  ProjectIntent,
  IntentRevision,
  Decision,
  FeedbackRecord,
  FeedbackType,
  DriftRecord,
  DriftFactor,
  StatusSet,
  StatusDefinition,
  ProjectType,
  SageProjectState,
  SageActor,
} from "./atlas-types";
import { STATUS_WORKFLOWS } from "./atlas-types";

// Generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// INTENT MANAGEMENT
// ============================================================================

export function createIntent(
  projectId: string,
  statement: string,
  actor: SageActor = "user"
): ProjectIntent {
  const now = new Date().toISOString();
  return {
    id: generateId("intent"),
    projectId,
    statement,
    createdAt: now,
    updatedAt: now,
    actor,
    revisionHistory: [],
  };
}

export function updateIntent(
  currentIntent: ProjectIntent,
  newStatement: string,
  actor: SageActor = "user",
  reason?: string
): ProjectIntent {
  const now = new Date().toISOString();
  const revision: IntentRevision = {
    id: generateId("rev"),
    statement: currentIntent.statement,
    createdAt: currentIntent.updatedAt,
    actor: currentIntent.actor,
    reason,
  };
  
  return {
    ...currentIntent,
    statement: newStatement,
    updatedAt: now,
    actor,
    revisionHistory: [...currentIntent.revisionHistory, revision],
  };
}

// ============================================================================
// DECISION MANAGEMENT
// ============================================================================

export function createDecision(
  projectId: string,
  decision: string,
  rationale: string,
  actor: SageActor = "user",
  relatedFeedbackIds?: string[],
  tags?: string[]
): Decision {
  return {
    id: generateId("dec"),
    projectId,
    decision,
    rationale,
    actor,
    createdAt: new Date().toISOString(),
    relatedFeedbackIds,
    tags,
  };
}

// ============================================================================
// FEEDBACK MANAGEMENT
// ============================================================================

export function createFeedbackRecord(
  projectId: string,
  rawInput: string,
  type: FeedbackType,
  reviewerRole: string,
  source: FeedbackRecord["source"] = "stakeholder",
  actionabilityScore: number = 50
): FeedbackRecord {
  return {
    id: generateId("fb"),
    projectId,
    rawInput,
    type,
    actionabilityScore,
    conflictFlag: false,
    reviewerRole,
    source,
    createdAt: new Date().toISOString(),
  };
}

export function resolveFeedback(
  feedback: FeedbackRecord,
  resolution: string
): FeedbackRecord {
  return {
    ...feedback,
    resolvedAt: new Date().toISOString(),
    resolution,
  };
}

export function markConflict(
  feedback: FeedbackRecord,
  conflictsWith: string[]
): FeedbackRecord {
  return {
    ...feedback,
    conflictFlag: true,
    conflictsWith,
  };
}

// ============================================================================
// DRIFT CALCULATION
// ============================================================================

export function calculateDrift(
  projectId: string,
  intent: ProjectIntent | null,
  decisions: Decision[],
  feedback: FeedbackRecord[],
  previousScore: number = 100
): DriftRecord {
  const factors: DriftFactor[] = [];
  
  // Factor 1: Unresolved feedback impacts drift
  const unresolvedFeedback = feedback.filter(f => !f.resolvedAt);
  const feedbackScore = Math.max(0, 100 - (unresolvedFeedback.length * 10));
  factors.push({
    name: "Unresolved Feedback",
    weight: 0.3,
    score: feedbackScore,
    description: `${unresolvedFeedback.length} items pending resolution`,
  });
  
  // Factor 2: Conflicts impact drift significantly
  const conflicts = feedback.filter(f => f.conflictFlag && !f.resolvedAt);
  const conflictScore = Math.max(0, 100 - (conflicts.length * 25));
  factors.push({
    name: "Active Conflicts",
    weight: 0.3,
    score: conflictScore,
    description: `${conflicts.length} unresolved conflicts`,
  });
  
  // Factor 3: Decision coverage (are feedbacks being addressed?)
  const recentDecisions = decisions.filter(d => {
    const decisionDate = new Date(d.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return decisionDate > weekAgo;
  });
  const decisionScore = Math.min(100, recentDecisions.length * 20 + 40);
  factors.push({
    name: "Decision Activity",
    weight: 0.2,
    score: decisionScore,
    description: `${recentDecisions.length} decisions this week`,
  });
  
  // Factor 4: Intent clarity (does intent exist and is it recent?)
  let intentScore = 50;
  if (intent) {
    const intentAge = Date.now() - new Date(intent.updatedAt).getTime();
    const daysOld = intentAge / (24 * 60 * 60 * 1000);
    intentScore = daysOld < 7 ? 100 : daysOld < 30 ? 80 : 60;
  }
  factors.push({
    name: "Intent Clarity",
    weight: 0.2,
    score: intentScore,
    description: intent ? "Intent defined" : "No intent set",
  });
  
  // Calculate weighted score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + (f.score * f.weight), 0) / totalWeight;
  const score = Math.round(weightedScore);
  
  return {
    id: generateId("drift"),
    projectId,
    score,
    delta: score - previousScore,
    calculatedAt: new Date().toISOString(),
    factors,
  };
}

// ============================================================================
// STATUS SET MANAGEMENT
// ============================================================================

export function createStatusSet(
  projectId: string,
  projectType: ProjectType,
  customStatuses?: StatusDefinition[]
): StatusSet {
  // Import STATUS_WORKFLOWS dynamically to avoid circular dependency
  const { STATUS_WORKFLOWS } = require("./atlas-types");
  
  const statuses = customStatuses || STATUS_WORKFLOWS[projectType] || STATUS_WORKFLOWS.custom;
  
  return {
    id: generateId("ss"),
    projectId,
    projectType,
    statuses: statuses.map((s: StatusDefinition, i: number) => ({
      ...s,
      id: s.id || generateId("status"),
      order: s.order ?? i,
    })),
    createdAt: new Date().toISOString(),
    createdBy: "sage",
  };
}

// ============================================================================
// INITIAL STATE
// ============================================================================

export function createInitialSageState(projectId: string): SageProjectState {
  return {
    projectId,
    intent: null,
    decisions: [],
    feedback: [],
    driftHistory: [],
    statusSet: null,
    currentDriftScore: 100,
    unresolvedFeedbackCount: 0,
    conflictCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// STATE AGGREGATION
// ============================================================================

export function aggregateSageState(
  projectId: string,
  intent: ProjectIntent | null,
  decisions: Decision[],
  feedback: FeedbackRecord[],
  driftHistory: DriftRecord[],
  statusSet: StatusSet | null
): SageProjectState {
  const unresolvedFeedback = feedback.filter(f => !f.resolvedAt);
  const conflicts = feedback.filter(f => f.conflictFlag && !f.resolvedAt);
  const latestDrift = driftHistory[driftHistory.length - 1];
  
  return {
    projectId,
    intent,
    decisions,
    feedback,
    driftHistory,
    statusSet,
    currentDriftScore: latestDrift?.score ?? 100,
    unresolvedFeedbackCount: unresolvedFeedback.length,
    conflictCount: conflicts.length,
    lastUpdated: new Date().toISOString(),
  };
}
