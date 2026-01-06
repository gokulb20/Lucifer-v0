// Context API - Health data from iOS app (HealthKit)
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

// Store latest health data
let healthData: {
  steps?: number;
  sleepHours?: number;
  activeMinutes?: number;
  heartRate?: number;
  workouts?: Array<{ type: string; duration: number; calories?: number }>;
  timestamp: string;
} | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ health: healthData });
  }

  if (req.method === "POST") {
    const { steps, sleepHours, activeMinutes, heartRate, workouts } = req.body;

    healthData = {
      steps,
      sleepHours,
      activeMinutes,
      heartRate,
      workouts,
      timestamp: new Date().toISOString(),
    };

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
        const workoutSummary = workouts.map((w) => `${w.type} (${w.duration}min)`).join(", ");
        notes.push(`Worked out: ${workoutSummary}`);
      }

      if (notes.length > 0) {
        await addToMemory([
          { role: "system", content: `Health update for Gokul: ${notes.join(". ")}` },
        ]);
      }
    }

    return res.status(200).json({ success: true, health: healthData });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
