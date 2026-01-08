// Cron: Check Pattern-Based Triggers
// Runs every hour via Vercel Cron
// Schedule: 0 * * * *

import type { NextApiRequest, NextApiResponse } from "next";
import { patternTriggers, TriggerId } from "@/lib/triggers";
import { shouldFireTrigger, getTriggerPriority } from "@/lib/decision";
import { generateMessage } from "@/lib/message-generator";
import { deliverTrigger, isPushConfigured } from "@/lib/push";
import { isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  if (!isPushConfigured()) {
    console.log("Warning: No push delivery method configured");
  }

  const results: Array<{
    triggerId: string;
    fired: boolean;
    reason?: string;
    message?: string;
  }> = [];

  // Check each pattern trigger
  for (const [triggerId, checkFn] of Object.entries(patternTriggers)) {
    try {
      const result = await checkFn();

      if (result.shouldFire) {
        // Check decision engine (cooldowns, quiet hours)
        const decision = await shouldFireTrigger(
          triggerId as TriggerId,
          result.context
        );

        if (decision.shouldFire) {
          // Generate message
          const message = await generateMessage(
            triggerId as TriggerId,
            result.context || {}
          );

          // Deliver
          const priority = getTriggerPriority(triggerId as TriggerId);
          await deliverTrigger(
            triggerId as TriggerId,
            result.context || {},
            message,
            priority
          );

          results.push({
            triggerId,
            fired: true,
            message,
          });
        } else {
          results.push({
            triggerId,
            fired: false,
            reason: decision.reason,
          });
        }
      } else {
        results.push({
          triggerId,
          fired: false,
          reason: "Condition not met",
        });
      }
    } catch (error) {
      console.error(`Error checking trigger ${triggerId}:`, error);
      results.push({
        triggerId,
        fired: false,
        reason: `Error: ${error}`,
      });
    }
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    results,
  });
}
