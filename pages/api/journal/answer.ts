// Journal Answer API - Save journal entry
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";
import { saveJournalEntry, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { promptId, prompt, answer } = req.body;

  if (!answer) {
    return res.status(400).json({ error: "Answer is required" });
  }

  try {
    const entry = await saveJournalEntry(promptId || 0, prompt || "Journal prompt", answer);

    // Store journal entry in Mem0
    if (process.env.MEM0_API_KEY) {
      await addToMemory([
        { role: "assistant", content: prompt || "Journal prompt" },
        { role: "user", content: answer },
      ]);
    }

    return res.status(200).json({ success: true, entry });
  } catch (error) {
    console.error("Failed to save journal entry:", error);
    return res.status(500).json({ error: "Failed to save journal entry" });
  }
}
