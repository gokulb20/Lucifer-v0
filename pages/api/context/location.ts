// Context API - Location updates from iOS app
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

// Store latest location (in production, use database)
let lastLocation: {
  lat: number;
  lng: number;
  name?: string;
  timestamp: string;
} | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ location: lastLocation });
  }

  if (req.method === "POST") {
    const { lat, lng, name } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng required" });
    }

    const newLocation = {
      lat,
      lng,
      name,
      timestamp: new Date().toISOString(),
    };

    // Check if location changed significantly (simple check)
    const locationChanged = !lastLocation ||
      Math.abs(lastLocation.lat - lat) > 0.001 ||
      Math.abs(lastLocation.lng - lng) > 0.001;

    lastLocation = newLocation;

    // Only store significant location changes in memory
    if (process.env.MEM0_API_KEY && locationChanged && name) {
      await addToMemory([
        { role: "system", content: `Gokul is now at: ${name}` },
      ]);
    }

    return res.status(200).json({ success: true, location: newLocation });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// Export for use in other endpoints
export { lastLocation };
