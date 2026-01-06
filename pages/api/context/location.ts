// Context API - Location updates from iOS app
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";
import { getLatestLocation, saveLocation, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    if (req.method === "GET") {
      const location = await getLatestLocation();
      return res.status(200).json({ location });
    }

    if (req.method === "POST") {
      const { lat, lng, name } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({ error: "lat and lng required" });
      }

      // Check if location changed significantly
      const lastLocation = await getLatestLocation();
      const locationChanged = !lastLocation ||
        Math.abs(lastLocation.lat - lat) > 0.001 ||
        Math.abs(lastLocation.lng - lng) > 0.001;

      const location = await saveLocation(lat, lng, name);

      // Only store significant location changes in memory
      if (process.env.MEM0_API_KEY && locationChanged && name) {
        await addToMemory([
          { role: "system", content: `Gokul is now at: ${name}` },
        ]);
      }

      return res.status(200).json({ success: true, location });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Location API error:", error);
    return res.status(500).json({ error: "Database error" });
  }
}
