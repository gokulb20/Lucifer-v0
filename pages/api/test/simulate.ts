// Test API: Simulate Triggers
// Use this to test the proactive system without real data

import type { NextApiRequest, NextApiResponse } from "next";
import { patternTriggers, eventTriggers, TriggerId } from "@/lib/triggers";
import { shouldFireTrigger, getTriggerPriority } from "@/lib/decision";
import { generateMessage, getFallbackMessage } from "@/lib/message-generator";
import { deliverTrigger, isPushConfigured } from "@/lib/push";
import { isSupabaseConfigured, saveHealth, logMood, saveLocation, saveScreenTime } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only allow in development or with test secret
  const testSecret = process.env.TEST_SECRET;
  if (process.env.NODE_ENV === "production" && req.headers.authorization !== `Bearer ${testSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { action, data } = req.body;

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    switch (action) {
      // Simulate bad sleep data
      case "inject_bad_sleep": {
        const entries = [];
        for (let i = 0; i < 3; i++) {
          const entry = await saveHealth({
            sleep_hours: data?.sleepHours || 4,
            steps: 5000,
          });
          entries.push(entry);
        }
        return res.status(200).json({ success: true, entries });
      }

      // Simulate low mood streak
      case "inject_low_mood": {
        const entries = [];
        for (let i = 0; i < 3; i++) {
          const entry = await logMood(data?.mood || 2, 2, "Simulated low mood");
          entries.push(entry);
        }
        return res.status(200).json({ success: true, entries });
      }

      // Simulate location change
      case "inject_location": {
        const entry = await saveLocation(
          data?.lat || 37.7749,
          data?.lng || -122.4194,
          data?.name || "Gym"
        );

        // Also trigger the event
        const result = await eventTriggers.location_change({
          lat: entry.lat,
          lng: entry.lng,
          name: entry.name,
        });

        return res.status(200).json({
          success: true,
          location: entry,
          triggerResult: result,
        });
      }

      // Simulate screen time
      case "inject_screen_time": {
        const entry = await saveScreenTime(
          new Date().toISOString().split("T")[0],
          data?.category || "social",
          data?.minutes || 200,
          data?.app || "Instagram"
        );
        return res.status(200).json({ success: true, entry });
      }

      // Force fire a specific trigger (bypasses conditions)
      case "force_trigger": {
        const triggerId = data?.triggerId as TriggerId;
        const context = data?.context || {};

        if (!triggerId) {
          return res.status(400).json({ error: "triggerId required" });
        }

        // Generate message (use fallback if Grok unavailable)
        let message: string;
        try {
          message = await generateMessage(triggerId, context);
        } catch {
          message = getFallbackMessage(triggerId);
        }

        // Deliver if configured
        if (isPushConfigured()) {
          const priority = getTriggerPriority(triggerId);
          await deliverTrigger(triggerId, context, message, priority);
        }

        return res.status(200).json({
          success: true,
          triggerId,
          message,
          delivered: isPushConfigured(),
        });
      }

      // Test message generation only
      case "test_message": {
        const triggerId = data?.triggerId as TriggerId;
        const context = data?.context || {};

        if (!triggerId) {
          return res.status(400).json({ error: "triggerId required" });
        }

        const message = await generateMessage(triggerId, context);

        return res.status(200).json({
          success: true,
          triggerId,
          message,
        });
      }

      // Check all pattern triggers
      case "check_all": {
        const results = [];

        for (const [triggerId, checkFn] of Object.entries(patternTriggers)) {
          const result = await checkFn();
          const decision = result.shouldFire
            ? await shouldFireTrigger(triggerId as TriggerId, result.context)
            : { shouldFire: false, reason: "Condition not met" };

          results.push({
            triggerId,
            conditionMet: result.shouldFire,
            context: result.context,
            wouldFire: decision.shouldFire,
            reason: decision.reason,
          });
        }

        return res.status(200).json({ results });
      }

      default:
        return res.status(400).json({
          error: "Unknown action",
          availableActions: [
            "inject_bad_sleep",
            "inject_low_mood",
            "inject_location",
            "inject_screen_time",
            "force_trigger",
            "test_message",
            "check_all",
          ],
        });
    }
  } catch (error) {
    console.error("Simulation error:", error);
    return res.status(500).json({ error: String(error) });
  }
}
