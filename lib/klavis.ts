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
export function getGrokTools() {
  return [
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
  ];
}

// Execute a tool call from Grok
export async function executeTool(
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
    // Map our tool names to Klavis tool names
    const toolMap: Record<string, string> = {
      gcalendar_list_events: "list_events",
      gcalendar_create_event: "create_event",
    };
    klavisToolName = toolMap[toolName] || toolName.replace("gcalendar_", "");
  } else {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
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
