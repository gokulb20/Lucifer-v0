// People API - Update specific person
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

// Reference to people array
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
  const { id } = req.query;

  if (req.method === "PATCH") {
    const personIndex = people.findIndex((p) => p.id === id);

    if (personIndex === -1) {
      return res.status(404).json({ error: "Person not found" });
    }

    const { name, relationship, notes, tags } = req.body;
    const person = people[personIndex];

    if (name !== undefined) person.name = name;
    if (relationship !== undefined) person.relationship = relationship;
    if (notes !== undefined) person.notes = notes;
    if (tags !== undefined) person.tags = tags;
    person.updatedAt = new Date().toISOString();

    // Store update in memory
    if (process.env.MEM0_API_KEY && notes !== undefined) {
      await addToMemory([
        { role: "user", content: `Updated notes about ${person.name}: ${notes}` },
      ]);
    }

    return res.status(200).json({ person });
  }

  if (req.method === "DELETE") {
    const personIndex = people.findIndex((p) => p.id === id);

    if (personIndex === -1) {
      return res.status(404).json({ error: "Person not found" });
    }

    people.splice(personIndex, 1);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
