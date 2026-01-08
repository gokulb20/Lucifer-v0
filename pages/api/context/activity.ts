// Context API - Activity data from iOS app (Motion)
import type { NextApiRequest, NextApiResponse } from "next";

// Store latest activity
let activityData: {
  activity: "stationary" | "walking" | "running" | "driving" | "cycling" | "unknown";
  confidence: number;
  timestamp: string;
} | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ activity: activityData });
  }

  if (req.method === "POST") {
    const { activity, confidence } = req.body;

    if (!activity) {
      return res.status(400).json({ error: "activity required" });
    }

    activityData = {
      activity,
      confidence: confidence || 1,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, activity: activityData });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export { activityData };
