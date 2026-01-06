// Mood API - Log and retrieve mood entries
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";
import { getMoodEntries, logMood, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    if (req.method === "GET") {
      const limit = parseInt(req.query.limit as string) || 30;
      const entries = await getMoodEntries(limit);
      return res.status(200).json({ entries });
    }

    if (req.method === "POST") {
      const { mood, energy, notes } = req.body;

      if (!mood || mood < 1 || mood > 5) {
        return res.status(400).json({ error: "Mood must be between 1-5" });
      }

      if (energy && (energy < 1 || energy > 5)) {
        return res.status(400).json({ error: "Energy must be between 1-5" });
      }

      const entry = await logMood(mood, energy, notes);

      // Store in memory for context
      if (process.env.MEM0_API_KEY) {
        const moodLabels = ["terrible", "bad", "okay", "good", "great"];
        const moodText = moodLabels[mood - 1];
        const energyText = energy ? `, energy: ${["very low", "low", "medium", "high", "very high"][energy - 1]}` : "";
        const notesText = notes ? `. ${notes}` : "";

        await addToMemory([
          { role: "system", content: `Gokul's mood check: feeling ${moodText}${energyText}${notesText}` },
        ]);
      }

      return res.status(201).json({ entry });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Mood API error:", error);
    return res.status(500).json({ error: "Database error" });
  }
}
