// Context API - Health data from iOS app (HealthKit)
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";
import { getLatestHealth, saveHealth, isSupabaseConfigured } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  try {
    if (req.method === "GET") {
      const health = await getLatestHealth();
      return res.status(200).json({ health });
    }

    if (req.method === "POST") {
      const { steps, sleepHours, activeMinutes, heartRate, workouts } = req.body;

      const health = await saveHealth({
        steps,
        sleep_hours: sleepHours,
        active_minutes: activeMinutes,
        heart_rate: heartRate,
        workouts,
      });

      // Store notable health data in memory
      if (process.env.MEM0_API_KEY) {
        const notes: string[] = [];

        if (sleepHours !== undefined) {
          if (sleepHours < 6) notes.push(`Only got ${sleepHours} hours of sleep`);
          else if (sleepHours >= 8) notes.push(`Got a solid ${sleepHours} hours of sleep`);
        }

        if (steps !== undefined) {
          if (steps > 10000) notes.push(`Hit ${steps.toLocaleString()} steps today`);
          else if (steps < 3000) notes.push(`Low activity day - only ${steps.toLocaleString()} steps`);
        }

        if (workouts && workouts.length > 0) {
          const workoutSummary = workouts.map((w: { type: string; duration: number }) => `${w.type} (${w.duration}min)`).join(", ");
          notes.push(`Worked out: ${workoutSummary}`);
        }

        if (notes.length > 0) {
          await addToMemory([
            { role: "system", content: `Health update for Gokul: ${notes.join(". ")}` },
          ]);
        }
      }

      return res.status(200).json({ success: true, health });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Health API error:", error);
    return res.status(500).json({ error: "Database error" });
  }
}
