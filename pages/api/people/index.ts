// People API - Manage people notes
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";
import { getPeople, addPerson, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    if (req.method === "GET") {
      const people = await getPeople();
      return res.status(200).json({ people });
    }

    if (req.method === "POST") {
      const { name, relationship, notes } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const person = await addPerson(name, relationship, notes);

      // Store in memory
      if (process.env.MEM0_API_KEY) {
        const context = `Person note about ${name}${relationship ? ` (${relationship})` : ""}: ${notes || "No notes yet"}`;
        await addToMemory([{ role: "user", content: context }]);
      }

      return res.status(201).json({ person });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("People API error:", error);
    return res.status(500).json({ error: "Database error" });
  }
}
