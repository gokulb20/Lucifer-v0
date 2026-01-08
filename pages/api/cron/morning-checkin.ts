// Cron: Morning Check-in
// Runs every day at 9am
// Schedule: 0 9 * * *

import type { NextApiRequest, NextApiResponse } from "next";
import { shouldFireTrigger, getTriggerPriority } from "@/lib/decision";
import { generateMessage } from "@/lib/message-generator";
import { deliverTrigger, isPushConfigured } from "@/lib/push";
import { isSupabaseConfigured, getHealthEntriesSince, getMoodEntriesSince, getStaleGoals } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // Check if we should fire
  const decision = await shouldFireTrigger("morning_checkin");

  if (!decision.shouldFire) {
    return res.status(200).json({
      triggered: false,
      reason: decision.reason,
    });
  }

  // Gather context for the morning message
  const [healthData, moodData, staleGoals] = await Promise.all([
    getHealthEntriesSince(1),
    getMoodEntriesSince(1),
    getStaleGoals(7),
  ]);

  const context: Record<string, any> = {
    type: "morning_checkin",
  };

  // Add relevant context
  if (healthData.length > 0 && healthData[0].sleep_hours) {
    context.lastNightSleep = healthData[0].sleep_hours;
  }

  if (moodData.length > 0) {
    context.recentMood = moodData[0].mood;
  }

  if (staleGoals.length > 0) {
    context.pendingGoals = staleGoals.length;
  }

  // Generate message
  const message = await generateMessage("morning_checkin", context);

  // Deliver
  if (isPushConfigured()) {
    const priority = getTriggerPriority("morning_checkin");
    await deliverTrigger("morning_checkin", context, message, priority);
  }

  return res.status(200).json({
    triggered: true,
    message,
    context,
  });
}
