// NewsAPI Integration

const NEWS_API = "https://newsapi.org/v2";

export function isNewsConfigured(): boolean {
  return !!process.env.NEWS_API_KEY;
}

// Get top headlines
export async function getHeadlines(
  category?: string,
  country: string = "us"
): Promise<string> {
  if (!process.env.NEWS_API_KEY) {
    return JSON.stringify({ error: "News API not configured" });
  }

  try {
    let url = `${NEWS_API}/top-headlines?country=${country}&apiKey=${process.env.NEWS_API_KEY}`;

    if (category) {
      url += `&category=${category}`;
    }

    const res = await fetch(url);

    if (!res.ok) {
      const error = await res.text();
      return JSON.stringify({ error: `News API error: ${error}` });
    }

    const data = await res.json();

    const articles = data.articles?.slice(0, 10).map((a: any) => ({
      title: a.title,
      source: a.source?.name,
      description: a.description,
      url: a.url,
      publishedAt: a.publishedAt
    })) || [];

    return JSON.stringify({ headlines: articles }, null, 2);
  } catch (error) {
    return JSON.stringify({ error: `Failed to get headlines: ${error}` });
  }
}

// Search news articles
export async function searchNews(query: string, maxResults: number = 10): Promise<string> {
  if (!process.env.NEWS_API_KEY) {
    return JSON.stringify({ error: "News API not configured" });
  }

  try {
    const res = await fetch(
      `${NEWS_API}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${maxResults}&apiKey=${process.env.NEWS_API_KEY}`
    );

    if (!res.ok) {
      const error = await res.text();
      return JSON.stringify({ error: `News API error: ${error}` });
    }

    const data = await res.json();

    const articles = data.articles?.map((a: any) => ({
      title: a.title,
      source: a.source?.name,
      description: a.description,
      url: a.url,
      publishedAt: a.publishedAt
    })) || [];

    return JSON.stringify({ articles }, null, 2);
  } catch (error) {
    return JSON.stringify({ error: `Failed to search news: ${error}` });
  }
}

// Tool definitions for Grok
export function getNewsTools() {
  return [
    {
      type: "function",
      function: {
        name: "news_headlines",
        description: "Get top news headlines. Can filter by category: business, entertainment, general, health, science, sports, technology.",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["business", "entertainment", "general", "health", "science", "sports", "technology"],
              description: "News category (optional)"
            },
            country: {
              type: "string",
              description: "2-letter country code (default: us)"
            }
          },
          required: []
        }
      }
    },
    {
      type: "function",
      function: {
        name: "news_search",
        description: "Search news articles for a specific topic or keyword.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for news articles"
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results (default 10)"
            }
          },
          required: ["query"]
        }
      }
    }
  ];
}

// Execute news tool
export async function executeNewsTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  if (toolName === "news_headlines") {
    return getHeadlines(args.category as string, (args.country as string) || "us");
  } else if (toolName === "news_search") {
    return searchNews(args.query as string, (args.maxResults as number) || 10);
  }

  return JSON.stringify({ error: `Unknown news tool: ${toolName}` });
}
