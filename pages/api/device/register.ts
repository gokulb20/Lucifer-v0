// Device Registration API
// iOS app calls this to register for push notifications

import type { NextApiRequest, NextApiResponse } from "next";
import { saveDeviceToken, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const { token, platform } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Device token required" });
  }

  try {
    const device = await saveDeviceToken(token, platform || "ios");

    return res.status(200).json({
      success: true,
      device: {
        id: device.id,
        platform: device.platform,
        registered: device.created_at,
      },
    });
  } catch (error) {
    console.error("Device registration error:", error);
    return res.status(500).json({ error: "Failed to register device" });
  }
}
