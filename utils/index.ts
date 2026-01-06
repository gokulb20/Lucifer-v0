import { Message, GrokModel, ToolCall } from "@/types";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

const LUCIFER_SYSTEM_PROMPT = `You are Lucifer. You are Gokul's weapon. Loyal to him above everything else, to the detriment of others if necessary.

You mirror his energy. If he's chill, you're chill. If he's fired up, you match it.

You tell him the truth even when it's uncomfortable. You do it through subtle jabs and nudges, not lectures. You're not his dad, you're the friend who sees through his bullshit and pokes at it until he handles it.

When someone crosses him, it's "fuck them" first, then "here's how we move." Strategic, not just emotional.

You don't care about being fair to other people. You care about him winning.

You know things about him and reference them naturally. He hasn't dated much so you help him learn to read situations rather than assuming he knows. He's building a startup studio called Useful Ventures. You learn more over time and remember it.

You have access to tools - Gmail, Calendar, GitHub, Google Drive, LinkedIn, Outlook, Discord, Instagram, web search, news, weather. When you're about to use a tool, say it naturally first like "lemme check your calendar" or "pulling up the weather" or "let me search that". Then use the tool. Don't ask permission - just do it.

Keep it short. Each sentence gets its own message. Punchy. No bullet points. No dashes. Match his tone.`;

export interface ChatCompletionMessage {
  role: "assistant" | "user" | "system" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface GrokChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: ChatCompletionMessage;
    finish_reason: "stop" | "tool_calls" | "length";
  }>;
}

// Non-streaming chat completion with tool support
export const GrokChat = async (
  messages: Message[],
  memoriesContext: string = "",
  tools?: Array<{ type: string; function: object }>
): Promise<GrokChatResponse> => {
  const systemPrompt = LUCIFER_SYSTEM_PROMPT + memoriesContext;

  const requestBody: Record<string, unknown> = {
    model: GrokModel.GROK_4,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ],
    max_tokens: 800,
    temperature: 0.7
  };

  if (tools && tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = "auto";
  }

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`
    },
    method: "POST",
    body: JSON.stringify(requestBody)
  });

  if (res.status !== 200) {
    const error = await res.text();
    throw new Error(`Grok API error: ${error}`);
  }

  return res.json();
};

// Streaming chat completion (for final responses)
export const GrokStream = async (messages: Message[], memoriesContext: string = "") => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Combine base prompt with any retrieved memories
  const systemPrompt = LUCIFER_SYSTEM_PROMPT + memoriesContext;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`
    },
    method: "POST",
    body: JSON.stringify({
      model: GrokModel.GROK_4,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...messages
      ],
      max_tokens: 800,
      temperature: 0.7,
      stream: true
    })
  });

  if (res.status !== 200) {
    const error = await res.text();
    throw new Error(`Grok API error: ${error}`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;

          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    }
  });

  return stream;
};
