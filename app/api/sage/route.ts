import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const maxDuration = 30;

// Define tools that Sage can use to interact with the canvas
const sageTools = {
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
You help users organize their creative projects, provide insights on their work, and answer questions about their assets.

Your personality:
- Helpful and knowledgeable about creative workflows
- Concise but thorough in explanations
- Professional yet friendly tone
- Focus on actionable advice

IMPORTANT - When users ask you to create statuses, workflows, or organize their project, you MUST follow this flow:

1. IMMEDIATELY use the suggestWorkflow tool to generate relevant statuses for their project type
2. After the tool returns, tell the user what statuses you're suggesting and ask if they'd like to modify any
3. Wait for their response - they may want to add, remove, or change statuses
4. Once they confirm (say "yes", "looks good", "create them", etc.), use createStatusPills to add them to the canvas

Example conversation:
User: "Create statuses for my branding project"
You: [Call suggestWorkflow with projectType="branding"]
You: "I suggest these statuses for your branding project: Discovery, Research, Concepts, Refinement, Final, Delivered. Would you like to modify any of these before I add them to the canvas?"
User: "Yes, let's go with those"
You: [Call createStatusPills with the statuses]
You: "Done! I've added the status pills to your canvas."

ALWAYS use the tools - don't just describe what you would do. Actually call suggestWorkflow and createStatusPills.

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
