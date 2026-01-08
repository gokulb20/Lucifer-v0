// Cron: Check Calendar for Upcoming Meetings
// Runs every 15 minutes
// Schedule: */15 * * * *

import type { NextApiRequest, NextApiResponse } from "next";
import { eventTriggers } from "@/lib/triggers";
import { shouldFireTrigger, getTriggerPriority } from "@/lib/decision";
import { generateMessage } from "@/lib/message-generator";
import { deliverTrigger, isPushConfigured } from "@/lib/push";
import { isSupabaseConfigured } from "@/lib/supabase";

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

  // TODO: Integrate with Klavis Calendar API
  // For now, this is a placeholder that shows the structure

  /*
  const klavisApiKey = process.env.KLAVIS_API_KEY;

  if (!klavisApiKey) {
    return res.status(200).json({
      checked: 0,
      reason: "Klavis not configured"
    });
  }

  // Get events in the next 60-75 minutes (15 min window)
  const now = new Date();
  const from = new Date(now.getTime() + 60 * 60 * 1000); // 60 min from now
  const to = new Date(now.getTime() + 75 * 60 * 1000);   // 75 min from now

  const events = await klavis.calendar.list({
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
  });

  for (const event of events) {
    const result = await eventTriggers.meeting_upcoming({
      title: event.summary,
      attendeeCount: event.attendees?.length || 0,
      startTime: event.start.dateTime,
    });

    if (result.shouldFire) {
      const decision = await shouldFireTrigger("meeting_prep", result.context);

      if (decision.shouldFire) {
        const message = await generateMessage("meeting_prep", result.context);
        const priority = getTriggerPriority("meeting_prep");
        await deliverTrigger("meeting_prep", result.context, message, priority);
      }
    }
  }
  */

  return res.status(200).json({
    checked: 0,
    note: "Calendar integration pending - connect Klavis calendar API",
  });
}
