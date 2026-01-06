// Context API - Contacts sync from iOS app
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

// Store contacts
let contacts: Array<{
  id: string;
  name: string;
  phone?: string;
  email?: string;
}> = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ contacts, count: contacts.length });
  }

  if (req.method === "POST") {
    const { contacts: newContacts } = req.body;

    if (!Array.isArray(newContacts)) {
      return res.status(400).json({ error: "contacts array required" });
    }

    // Update contacts list
    contacts = newContacts.map((c: any, i: number) => ({
      id: c.id || `contact_${i}`,
      name: c.name,
      phone: c.phone,
      email: c.email,
    }));

    // Store contact count in memory (not individual contacts for privacy)
    if (process.env.MEM0_API_KEY) {
      await addToMemory([
        { role: "system", content: `Gokul has ${contacts.length} contacts synced from phone` },
      ]);
    }

    return res.status(200).json({ success: true, count: contacts.length });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export { contacts };
