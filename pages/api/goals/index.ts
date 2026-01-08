// Goals API - List and create goals
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";
import { getGoals, createGoal, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    if (req.method === "GET") {
      const goals = await getGoals();
      return res.status(200).json({ goals });
    }

    if (req.method === "POST") {
      const { title, description } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      const goal = await createGoal(title, description);

      // Store in Mem0
      if (process.env.MEM0_API_KEY) {
        await addToMemory([
          { role: "user", content: `I set a new goal: ${title}${description ? ` - ${description}` : ""}` },
          { role: "assistant", content: `Got it. I'll help you stay on track with: ${title}` },
        ]);
      }

      return res.status(201).json({ goal });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Goals API error:", error);
    return res.status(500).json({ error: "Database error" });
  }
}
