// Goals API - List and create goals
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory, searchMemories } from "@/lib/memory";

// In-memory store (in production, use a database)
let goals: Array<{
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: "active" | "completed" | "paused";
  createdAt: string;
  updatedAt: string;
}> = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // List all goals
    return res.status(200).json({ goals });
  }

  if (req.method === "POST") {
    // Create new goal
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const newGoal = {
      id: `goal_${Date.now()}`,
      title,
      description,
      progress: 0,
      status: "active" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    goals.push(newGoal);

    // Store in memory
    if (process.env.MEM0_API_KEY) {
      await addToMemory([
        { role: "user", content: `I set a new goal: ${title}${description ? ` - ${description}` : ""}` },
        { role: "assistant", content: `Got it. I'll help you stay on track with: ${title}` },
      ]);
    }

    return res.status(201).json({ goal: newGoal });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
