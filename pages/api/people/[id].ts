// People API - Update and delete specific person
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";
import { updatePerson, deletePerson, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid person ID" });
  }

  try {
    if (req.method === "PATCH") {
      const { name, relationship, notes } = req.body;

      const person = await updatePerson(id, { name, relationship, notes });

      // Store update in memory
      if (process.env.MEM0_API_KEY && notes !== undefined) {
        await addToMemory([
          { role: "user", content: `Updated notes about ${person.name}: ${notes}` },
        ]);
      }

      return res.status(200).json({ person });
    }

    if (req.method === "DELETE") {
      await deletePerson(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Person API error:", error);
    return res.status(500).json({ error: "Database error" });
  }
}
