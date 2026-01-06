import { Message } from "@/types";
import { GrokChat, GrokStream } from "@/utils";
import { searchMemories, addToMemory, formatMemoriesForPrompt } from "@/lib/memory";
import { getKlavisTools, executeKlavisTool, isKlavisConfigured } from "@/lib/klavis";
import { getWeatherTools, executeWeatherTool, isWeatherConfigured } from "@/lib/weather";
import { getSearchTools, executeSearchTool, isTavilyConfigured } from "@/lib/tavily";
import { getNewsTools, executeNewsTool, isNewsConfigured } from "@/lib/news";

export const config = {
  runtime: "edge"
};

// Maximum number of tool call rounds to prevent infinite loops
const MAX_TOOL_ROUNDS = 5;

const handler = async (req: Request): Promise<Response> => {
  try {
    const { messages } = (await req.json()) as {
      messages: Message[];
    };

    const charLimit = 12000;
    let charCount = 0;
    let messagesToSend: Message[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (charCount + message.content.length > charLimit) {
        break;
      }
      charCount += message.content.length;
      messagesToSend.push(message);
    }

    // Get the latest user message for memory search
    const latestUserMessage = messagesToSend
      .filter((m) => m.role === "user")
      .pop();

    // Search for relevant memories
    let memoriesContext = "";
    if (latestUserMessage && process.env.MEM0_API_KEY) {
      try {
        const memories = await searchMemories(latestUserMessage.content);
        memoriesContext = formatMemoriesForPrompt(memories);
      } catch (e) {
        console.error("Memory search failed:", e);
      }
    }

    // Collect all available tools
    const tools: any[] = [];

    if (isKlavisConfigured()) {
      tools.push(...getKlavisTools());
    }
    if (isWeatherConfigured()) {
      tools.push(...getWeatherTools());
    }
    if (isTavilyConfigured()) {
      tools.push(...getSearchTools());
    }
    if (isNewsConfigured()) {
      tools.push(...getNewsTools());
    }

    // If we have tools, use the agentic loop
    if (tools && tools.length > 0) {
      let workingMessages = [...messagesToSend];
      let toolRounds = 0;

      while (toolRounds < MAX_TOOL_ROUNDS) {
        // Call Grok with tools
        const response = await GrokChat(workingMessages, memoriesContext, tools);
        const choice = response.choices[0];
        const assistantMessage = choice.message;

        // If no tool calls, we're done - return the response
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          // Save conversation to memory in the background
          if (process.env.MEM0_API_KEY && messagesToSend.length > 0) {
            addToMemory(messagesToSend).catch((e) =>
              console.error("Failed to save to memory:", e)
            );
          }

          // Return the text response
          const responseText = assistantMessage.content || "";
          return new Response(responseText, {
            headers: { "Content-Type": "text/plain" }
          });
        }

        // Process tool calls
        console.log(`Processing ${assistantMessage.tool_calls.length} tool calls (round ${toolRounds + 1})`);

        // Add assistant message with tool calls to working messages
        workingMessages.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls
        } as Message);

        // Execute each tool call and add results
        for (const toolCall of assistantMessage.tool_calls) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const toolName = toolCall.function.name;
            console.log(`Executing tool: ${toolName}`, args);

            // Route to correct tool handler
            let result: string;
            if (toolName.startsWith("weather_")) {
              result = await executeWeatherTool(toolName, args);
            } else if (toolName === "web_search") {
              result = await executeSearchTool(toolName, args);
            } else if (toolName.startsWith("news_")) {
              result = await executeNewsTool(toolName, args);
            } else {
              // Klavis tools (gmail_, gcalendar_, github_, drive_, linkedin_, outlook_, discord_, instagram_)
              result = await executeKlavisTool(toolName, args);
            }

            // Add tool result message
            workingMessages.push({
              role: "tool",
              content: result,
              tool_call_id: toolCall.id
            } as Message);
          } catch (e) {
            console.error(`Tool execution error for ${toolCall.function.name}:`, e);
            workingMessages.push({
              role: "tool",
              content: JSON.stringify({ error: `Tool execution failed: ${e}` }),
              tool_call_id: toolCall.id
            } as Message);
          }
        }

        toolRounds++;
      }

      // If we hit max rounds, get a final response without tools
      const finalResponse = await GrokChat(workingMessages, memoriesContext);
      return new Response(finalResponse.choices[0].message.content || "", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // No tools - use streaming response
    const stream = await GrokStream(messagesToSend, memoriesContext);

    // Save conversation to memory in the background (don't await)
    if (process.env.MEM0_API_KEY && messagesToSend.length > 0) {
      addToMemory(messagesToSend).catch((e) =>
        console.error("Failed to save to memory:", e)
      );
    }

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;
