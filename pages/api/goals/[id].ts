// Goals API - Update specific goal
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

// Reference to goals array (shared with index.ts in real app, use DB)
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
  const { id } = req.query;

  if (req.method === "PATCH") {
    const goalIndex = goals.findIndex((g) => g.id === id);

    if (goalIndex === -1) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const { progress, status, title, description } = req.body;
    const goal = goals[goalIndex];

    if (progress !== undefined) goal.progress = progress;
    if (status !== undefined) goal.status = status;
    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    goal.updatedAt = new Date().toISOString();

    // Store progress update in memory
    if (process.env.MEM0_API_KEY && (progress !== undefined || status !== undefined)) {
      const update = status === "completed"
        ? `I completed my goal: ${goal.title}`
        : `Updated progress on "${goal.title}" to ${goal.progress}%`;

      await addToMemory([
        { role: "user", content: update },
        { role: "assistant", content: status === "completed" ? "Nice work." : "Keep going." },
      ]);
    }

    return res.status(200).json({ goal });
  }

  if (req.method === "DELETE") {
    const goalIndex = goals.findIndex((g) => g.id === id);

    if (goalIndex === -1) {
      return res.status(404).json({ error: "Goal not found" });
    }

    goals.splice(goalIndex, 1);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
