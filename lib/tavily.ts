// Tavily Web Search API Integration

const TAVILY_API = "https://api.tavily.com";

export function isTavilyConfigured(): boolean {
  return !!process.env.TAVILY_API_KEY;
}

// Search the web
export async function webSearch(query: string, maxResults: number = 5): Promise<string> {
  if (!process.env.TAVILY_API_KEY) {
    return JSON.stringify({ error: "Web search API not configured" });
  }

  try {
    const res = await fetch(`${TAVILY_API}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false
      })
    });

    if (!res.ok) {
      const error = await res.text();
      return JSON.stringify({ error: `Search API error: ${error}` });
    }

    const data = await res.json();

    // Format results for LLM consumption
    const results = {
      answer: data.answer || null,
      results: data.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content
      })) || []
    };

    return JSON.stringify(results, null, 2);
  } catch (error) {
    return JSON.stringify({ error: `Failed to search: ${error}` });
  }
}

// Tool definitions for Grok
export function getSearchTools() {
  return [
    {
      type: "function",
      function: {
        name: "web_search",
        description: "Search the web for current information. Use when you need to look up facts, news, or anything you don't know.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query"
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results (default 5)"
            }
          },
          required: ["query"]
        }
      }
    }
  ];
}

// Execute search tool
export async function executeSearchTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  if (toolName === "web_search") {
    return webSearch(args.query as string, (args.maxResults as number) || 5);
  }

  return JSON.stringify({ error: `Unknown search tool: ${toolName}` });
}
