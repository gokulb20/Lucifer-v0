// Klavis.ai Integration for Lucifer
// Provides tool access to Gmail, Google Calendar via MCP

const KLAVIS_API = "https://api.klavis.ai";
const USER_ID = "gokul";

// Cache instance data
interface InstanceData {
  serverUrl: string;
  instanceId: string;
}

const instanceCache: Record<string, InstanceData> = {};

// Get Klavis API headers
function getHeaders() {
  if (!process.env.KLAVIS_API_KEY) {
    throw new Error("KLAVIS_API_KEY not set");
  }
  return {
    Authorization: `Bearer ${process.env.KLAVIS_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Check if Klavis is configured
export function isKlavisConfigured(): boolean {
  return !!process.env.KLAVIS_API_KEY;
}

// Get or create an instance for a service
async function getOrCreateInstance(serverName: string): Promise<InstanceData | null> {
  if (!isKlavisConfigured()) return null;

  // Check cache first
  if (instanceCache[serverName]) {
    return instanceCache[serverName];
  }

  try {
    const res = await fetch(`${KLAVIS_API}/mcp-server/instance/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        serverName,
        userId: USER_ID,
      }),
    });

    if (!res.ok) {
      console.error(`Instance creation failed for ${serverName}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const instanceData: InstanceData = {
      serverUrl: data.serverUrl,
      instanceId: data.instanceId,
    };

    instanceCache[serverName] = instanceData;
    return instanceData;
  } catch (error) {
    console.error(`Failed to create instance for ${serverName}:`, error);
    return null;
  }
}

// Call a tool via Klavis MCP
export async function callKlavisTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const instance = await getOrCreateInstance(serverName);
  if (!instance) {
    return { error: `Failed to get instance for ${serverName}` };
  }

  try {
    const res = await fetch(`${KLAVIS_API}/mcp-server/call-tool`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        serverUrl: instance.serverUrl,
        toolName,
        args,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Tool call failed: ${res.status}`, errorText);
      return { error: `Tool call failed: ${errorText}` };
    }

    return await res.json();
  } catch (error) {
    console.error(`Failed to call tool ${toolName}:`, error);
    return { error: `Failed to call tool: ${error}` };
  }
}

// Define tools for Grok in OpenAI function calling format
export function getKlavisTools() {
  return [
    // Gmail tools
    {
      type: "function",
      function: {
        name: "gmail_search_emails",
        description: "Search for emails in Gmail. Use Gmail search syntax like 'from:person@email.com' or 'subject:meeting' or just keywords.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Gmail search query (e.g., 'from:john@example.com', 'subject:deal', 'is:unread')",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results to return (default 10)",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "gmail_read_email",
        description: "Read a specific email by its message ID. Use this after searching to get full email content.",
        parameters: {
          type: "object",
          properties: {
            messageId: {
              type: "string",
              description: "The ID of the email message to read",
            },
          },
          required: ["messageId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "gmail_send_email",
        description: "Send an email. Only use when explicitly asked to send an email.",
        parameters: {
          type: "object",
          properties: {
            to: {
              type: "array",
              items: { type: "string" },
              description: "List of recipient email addresses",
            },
            subject: {
              type: "string",
              description: "Email subject line",
            },
            body: {
              type: "string",
              description: "Email body content",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "gmail_search_contacts",
        description: "Search for contacts to find email addresses. Use when you need to find someone's email.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for contact name or email",
            },
          },
          required: ["query"],
        },
      },
    },
    // Google Calendar tools
    {
      type: "function",
      function: {
        name: "gcalendar_list_events",
        description: "List upcoming calendar events. Use to check schedule, availability, or find meetings.",
        parameters: {
          type: "object",
          properties: {
            timeMin: {
              type: "string",
              description: "Start time in ISO format (default: now)",
            },
            timeMax: {
              type: "string",
              description: "End time in ISO format (default: 7 days from now)",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of events to return (default 10)",
            },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "gcalendar_create_event",
        description: "Create a new calendar event. Only use when explicitly asked to schedule something.",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Event title",
            },
            startTime: {
              type: "string",
              description: "Start time in ISO format",
            },
            endTime: {
              type: "string",
              description: "End time in ISO format",
            },
            description: {
              type: "string",
              description: "Event description",
            },
            location: {
              type: "string",
              description: "Event location",
            },
          },
          required: ["summary", "startTime", "endTime"],
        },
      },
    },
    // GitHub tools
    {
      type: "function",
      function: {
        name: "github_list_repos",
        description: "List your GitHub repositories.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["all", "owner", "public", "private"],
              description: "Type of repos to list (default: all)",
            },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "github_list_issues",
        description: "List issues for a repository.",
        parameters: {
          type: "object",
          properties: {
            repo: {
              type: "string",
              description: "Repository name (owner/repo format)",
            },
            state: {
              type: "string",
              enum: ["open", "closed", "all"],
              description: "Issue state filter (default: open)",
            },
          },
          required: ["repo"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "github_list_prs",
        description: "List pull requests for a repository.",
        parameters: {
          type: "object",
          properties: {
            repo: {
              type: "string",
              description: "Repository name (owner/repo format)",
            },
            state: {
              type: "string",
              enum: ["open", "closed", "all"],
              description: "PR state filter (default: open)",
            },
          },
          required: ["repo"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "github_create_issue",
        description: "Create a new issue in a repository. Only use when explicitly asked.",
        parameters: {
          type: "object",
          properties: {
            repo: {
              type: "string",
              description: "Repository name (owner/repo format)",
            },
            title: {
              type: "string",
              description: "Issue title",
            },
            body: {
              type: "string",
              description: "Issue body/description",
            },
          },
          required: ["repo", "title"],
        },
      },
    },
    // Google Drive tools
    {
      type: "function",
      function: {
        name: "drive_search",
        description: "Search for files in Google Drive.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for file names or content",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "drive_list_files",
        description: "List files in Google Drive, optionally in a specific folder.",
        parameters: {
          type: "object",
          properties: {
            folderId: {
              type: "string",
              description: "Folder ID to list files from (optional, defaults to root)",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of files to return (default: 10)",
            },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "drive_read_file",
        description: "Read the content of a file from Google Drive.",
        parameters: {
          type: "object",
          properties: {
            fileId: {
              type: "string",
              description: "The ID of the file to read",
            },
          },
          required: ["fileId"],
        },
      },
    },
    // LinkedIn tools
    {
      type: "function",
      function: {
        name: "linkedin_get_profile",
        description: "Get your LinkedIn profile information.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "linkedin_post",
        description: "Create a post on LinkedIn. Only use when explicitly asked.",
        parameters: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The post content",
            },
          },
          required: ["text"],
        },
      },
    },
    // Outlook Mail tools
    {
      type: "function",
      function: {
        name: "outlook_search_emails",
        description: "Search for emails in Outlook.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for emails",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results (default: 10)",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "outlook_read_email",
        description: "Read a specific email by its ID.",
        parameters: {
          type: "object",
          properties: {
            messageId: {
              type: "string",
              description: "The ID of the email to read",
            },
          },
          required: ["messageId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "outlook_send_email",
        description: "Send an email via Outlook. Only use when explicitly asked.",
        parameters: {
          type: "object",
          properties: {
            to: {
              type: "array",
              items: { type: "string" },
              description: "List of recipient email addresses",
            },
            subject: {
              type: "string",
              description: "Email subject",
            },
            body: {
              type: "string",
              description: "Email body content",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
    },
    // Discord tools
    {
      type: "function",
      function: {
        name: "discord_list_servers",
        description: "List Discord servers you're in.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "discord_list_channels",
        description: "List channels in a Discord server.",
        parameters: {
          type: "object",
          properties: {
            serverId: {
              type: "string",
              description: "The server/guild ID",
            },
          },
          required: ["serverId"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "discord_send_message",
        description: "Send a message to a Discord channel. Only use when explicitly asked.",
        parameters: {
          type: "object",
          properties: {
            channelId: {
              type: "string",
              description: "The channel ID to send to",
            },
            content: {
              type: "string",
              description: "Message content",
            },
          },
          required: ["channelId", "content"],
        },
      },
    },
    // Instagram tools
    {
      type: "function",
      function: {
        name: "instagram_get_profile",
        description: "Get your Instagram profile information.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "instagram_get_posts",
        description: "Get your recent Instagram posts.",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of posts to retrieve (default: 10)",
            },
          },
          required: [],
        },
      },
    },
  ];
}

// Backwards compatibility alias
export const getGrokTools = getKlavisTools;

// Execute a tool call from Grok
export async function executeKlavisTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  let serverName: string;
  let klavisToolName: string;

  // Map tool names to Klavis servers and tool names
  // Note: Klavis requires exact casing for server names
  if (toolName.startsWith("gmail_")) {
    serverName = "Gmail";
    klavisToolName = toolName;
  } else if (toolName.startsWith("gcalendar_")) {
    serverName = "Google Calendar";
    const toolMap: Record<string, string> = {
      gcalendar_list_events: "list_events",
      gcalendar_create_event: "create_event",
    };
    klavisToolName = toolMap[toolName] || toolName.replace("gcalendar_", "");
  } else if (toolName.startsWith("github_")) {
    serverName = "GitHub";
    klavisToolName = toolName.replace("github_", "");
  } else if (toolName.startsWith("drive_")) {
    serverName = "Google Drive";
    klavisToolName = toolName.replace("drive_", "");
  } else if (toolName.startsWith("linkedin_")) {
    serverName = "LinkedIn";
    klavisToolName = toolName.replace("linkedin_", "");
  } else if (toolName.startsWith("outlook_")) {
    serverName = "Outlook";
    klavisToolName = toolName.replace("outlook_", "");
  } else if (toolName.startsWith("discord_")) {
    serverName = "Discord";
    klavisToolName = toolName.replace("discord_", "");
  } else if (toolName.startsWith("instagram_")) {
    serverName = "Instagram";
    klavisToolName = toolName.replace("instagram_", "");
  } else {
    return JSON.stringify({ error: `Unknown Klavis tool: ${toolName}` });
  }

  // Add defaults for calendar events
  if (toolName === "gcalendar_list_events") {
    if (!args.timeMin) {
      args.timeMin = new Date().toISOString();
    }
    if (!args.timeMax) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      args.timeMax = futureDate.toISOString();
    }
    if (!args.maxResults) {
      args.maxResults = 10;
    }
  }

  const result = await callKlavisTool(serverName, klavisToolName, args);
  return JSON.stringify(result, null, 2);
}

// Backwards compatibility alias
export const executeTool = executeKlavisTool;
