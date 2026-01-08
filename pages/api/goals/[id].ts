// Goals API - Update and delete specific goals
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";
import { updateGoal, deleteGoal, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid goal ID" });
  }

  try {
    if (req.method === "PATCH") {
      const { title, description, progress, status } = req.body;

      const goal = await updateGoal(id, { title, description, progress, status });

      // Log completion to memory
      if (status === "completed" && process.env.MEM0_API_KEY) {
        await addToMemory([
          { role: "system", content: `Gokul completed a goal: ${goal.title}` },
        ]);
      }

      return res.status(200).json({ goal });
    }

    if (req.method === "DELETE") {
      await deleteGoal(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Goal API error:", error);
    return res.status(500).json({ error: "Database error" });
  }
}
