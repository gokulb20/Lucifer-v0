// People API - Manage people notes
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

// In-memory store (use database in production)
let people: Array<{
  id: string;
  name: string;
  relationship?: string;
  notes: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}> = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ people });
  }

  if (req.method === "POST") {
    const { name, relationship, notes, tags } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const person = {
      id: `person_${Date.now()}`,
      name,
      relationship,
      notes: notes || "",
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    people.push(person);

    // Store in memory
    if (process.env.MEM0_API_KEY) {
      const context = `Person note about ${name}${relationship ? ` (${relationship})` : ""}: ${notes}`;
      await addToMemory([
        { role: "user", content: context },
      ]);
    }

    return res.status(201).json({ person });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
