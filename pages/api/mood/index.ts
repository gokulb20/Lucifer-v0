// Mood API - Log and retrieve mood
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

// In-memory store (use database in production)
let moodHistory: Array<{
  id: string;
  mood: number; // 1-5 scale
  energy: number; // 1-5 scale
  note?: string;
  timestamp: string;
}> = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Get mood history (last 30 entries)
    const history = moodHistory.slice(-30);
    return res.status(200).json({ history });
  }

  if (req.method === "POST") {
    const { mood, energy, note } = req.body;

    if (!mood || mood < 1 || mood > 5) {
      return res.status(400).json({ error: "Mood must be 1-5" });
    }

    const entry = {
      id: `mood_${Date.now()}`,
      mood,
      energy: energy || 3,
      note,
      timestamp: new Date().toISOString(),
    };

    moodHistory.push(entry);

    // Store in memory for context
    if (process.env.MEM0_API_KEY) {
      const moodLabels = ["terrible", "bad", "okay", "good", "great"];
      const energyLabels = ["exhausted", "tired", "moderate", "energized", "pumped"];

      await addToMemory([
        {
          role: "user",
          content: `Mood check: feeling ${moodLabels[mood - 1]}, energy is ${energyLabels[(energy || 3) - 1]}${note ? `. ${note}` : ""}`,
        },
      ]);
    }

    return res.status(201).json({ entry });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
