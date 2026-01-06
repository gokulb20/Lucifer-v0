import { MemoryClient } from "mem0ai";

// Initialize Mem0 client
const getMemoryClient = () => {
  if (!process.env.MEM0_API_KEY) {
    console.warn("MEM0_API_KEY not set - memory features disabled");
    return null;
  }
  return new MemoryClient({
    apiKey: process.env.MEM0_API_KEY,
  });
};

// User ID for Gokul (single user for now)
const USER_ID = "gokul";

// Add conversation to memory
export async function addToMemory(messages: Array<{ role: string; content: string }>) {
  const client = getMemoryClient();
  if (!client) return null;

  try {
    const result = await client.add(
      messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { user_id: USER_ID }
    );
    return result;
  } catch (error) {
    console.error("Failed to add to memory:", error);
    return null;
  }
}

// Search for relevant memories based on the current message
export async function searchMemories(query: string, limit: number = 5) {
  const client = getMemoryClient();
  if (!client) return [];

  try {
    const results = await client.search(query, {
      user_id: USER_ID,
      limit,
    });
    return results;
  } catch (error) {
    console.error("Failed to search memories:", error);
    return [];
  }
}

// Get all memories for the user
export async function getAllMemories() {
  const client = getMemoryClient();
  if (!client) return [];

  try {
    const results = await client.getAll({ user_id: USER_ID });
    return results;
  } catch (error) {
    console.error("Failed to get memories:", error);
    return [];
  }
}

// Format memories into a string for the system prompt
export function formatMemoriesForPrompt(memories: any[]): string {
  if (!memories || memories.length === 0) return "";

  const memoryTexts = memories
    .map((m) => m.memory || m.data?.memory || "")
    .filter((text) => text.length > 0);

  if (memoryTexts.length === 0) return "";

  return `\n\nThings you remember about Gokul:\n${memoryTexts.map((m) => `- ${m}`).join("\n")}`;
}
