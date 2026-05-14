import { NextResponse } from "next/server";

interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
}

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

async function fetchWithAuth(url: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Workflow-Editor",
  };

  // Add token if available
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  return response.json();
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null;
  
  // Handle full URLs like https://github.com/owner/repo
  const urlMatch = url.match(/github\.com\/([^\/]+)(?:\/([^\/\?#]+))?/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] || "" };
  }
  
  // Handle shorthand like owner/repo
  const shortMatch = url.match(/^([^\/]+)\/([^\/]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }
  
  // Handle just owner/profile
  const ownerMatch = url.match(/^([^\/]+)$/);
  if (ownerMatch) {
    return { owner: ownerMatch[1], repo: "" };
  }
  
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { githubUrl, branch = "main", fetchReadme, fetchStructure, fetchKeyFiles } = body;
    
    // Support both githubUrl and legacy owner/repo format
    let owner = body.owner;
    let repo = body.repo;
    
    if (githubUrl) {
      const parsed = parseGitHubUrl(githubUrl);
      if (parsed) {
        owner = parsed.owner;
        repo = parsed.repo;
      }
    }

    if (!owner) {
      return NextResponse.json({ error: "GitHub URL or owner is required" }, { status: 400 });
    }
    
    // If no repo specified, fetch user/org profile info
    if (!repo) {
      const userInfo = await fetchWithAuth(`https://api.github.com/users/${owner}`);
      const reposInfo = await fetchWithAuth(`https://api.github.com/users/${owner}/repos?per_page=10&sort=updated`);
      
      let output = `# GitHub Profile: ${owner}\n\n`;
      output += `**Name:** ${userInfo.name || owner}\n`;
      output += `**Bio:** ${userInfo.bio || "No bio"}\n`;
      output += `**Public Repos:** ${userInfo.public_repos}\n\n`;
      output += `## Recent Repositories\n\n`;
      
      for (const r of reposInfo) {
        output += `- **${r.name}**: ${r.description || "No description"}\n`;
      }
      
      return NextResponse.json({ output, raw: { user: userInfo, repos: reposInfo } });
    }

    const result: {
      readme?: string;
      structure?: GitHubFile[];
      keyFiles?: { path: string; content: string }[];
    } = {};

    // Fetch README
    if (fetchReadme) {
      try {
        const readmeData = await fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/readme?ref=${branch}`
        );
        result.readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
      } catch {
        result.readme = "No README found";
      }
    }

    // Fetch file structure
    if (fetchStructure) {
      try {
        const treeData = await fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
        );
        result.structure = treeData.tree
          .filter((item: GitHubTreeItem) => item.type === "blob")
          .slice(0, 100)
          .map((item: GitHubTreeItem) => ({
            name: item.path.split("/").pop(),
            path: item.path,
            type: "file",
            size: item.size,
          }));
      } catch {
        result.structure = [];
      }
    }

    // Fetch key files
    if (fetchKeyFiles) {
      const keyFilePaths = [
        "package.json",
        "tsconfig.json",
        "next.config.js",
        "next.config.mjs",
        "tailwind.config.js",
        "tailwind.config.ts",
        ".env.example",
      ];

      result.keyFiles = [];

      for (const filePath of keyFilePaths) {
        try {
          const fileData = await fetchWithAuth(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`
          );
          if (fileData.content) {
            result.keyFiles.push({
              path: filePath,
              content: Buffer.from(fileData.content, "base64").toString("utf-8"),
            });
          }
        } catch {
          // File doesn't exist, skip
        }
      }
    }

    // Format the output
    let output = `# Repository: ${owner}/${repo}\n\n`;

    if (result.readme) {
      output += `## README\n\n${result.readme}\n\n`;
    }

    if (result.structure && result.structure.length > 0) {
      output += `## File Structure\n\n\`\`\`\n`;
      output += result.structure.map((f) => f.path).join("\n");
      output += `\n\`\`\`\n\n`;
    }

    if (result.keyFiles && result.keyFiles.length > 0) {
      output += `## Key Files\n\n`;
      for (const file of result.keyFiles) {
        output += `### ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      }
    }

    return NextResponse.json({ output, raw: result });
  } catch (error) {
    console.error("GitHub fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repository" },
      { status: 500 }
    );
  }
}
