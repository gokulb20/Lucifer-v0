// Journal Answer API - Save journal entry
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, answer, date } = req.body;

  if (!answer) {
    return res.status(400).json({ error: "Answer is required" });
  }

  try {
    // Store journal entry in memory
    const journalEntry = `Journal entry (${date || new Date().toISOString().split("T")[0]}): Asked "${prompt}" - Gokul answered: "${answer}"`;

    if (process.env.MEM0_API_KEY) {
      await addToMemory([
        { role: "assistant", content: prompt || "Journal prompt" },
        { role: "user", content: answer },
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Journal entry saved",
      entry: {
        prompt,
        answer,
        date: date || new Date().toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Failed to save journal entry:", error);
    res.status(500).json({ error: "Failed to save journal entry" });
  }
}
