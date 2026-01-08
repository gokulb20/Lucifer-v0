// Trigger Evaluation System
// Checks conditions and determines if triggers should fire

import {
  getHealthEntriesSince,
  getMoodEntriesSince,
  getStaleGoals,
  getLastUserMessage,
  getScreenTimeByCategory,
  getKnownLocations,
  isVipEmail,
} from "./supabase";

export interface TriggerResult {
  shouldFire: boolean;
  triggerId: string;
  context?: Record<string, any>;
}

// Trigger definitions with cooldowns and priorities
export const TRIGGERS = {
  sleep_deprived: {
    description: "Sleep < 5 hours for 3 days",
    cooldownHours: 24,
    priority: "medium" as const,
  },
  workout_streak_broken: {
    description: "No workout in 7 days",
    cooldownHours: 48,
    priority: "low" as const,
  },
  low_mood_streak: {
    description: "Bad mood for 3 days",
    cooldownHours: 24,
    priority: "high" as const,
  },
  goal_stale: {
    description: "Goal not updated in 14 days",
    cooldownHours: 168, // 7 days
    priority: "low" as const,
  },
  gone_quiet: {
    description: "Haven't talked in 2 days",
    cooldownHours: 48,
    priority: "low" as const,
  },
  doomscroll: {
    description: "Screen time > 3hrs on social",
    cooldownHours: 24,
    priority: "medium" as const,
  },
  at_gym: {
    description: "Arrived at gym",
    cooldownHours: 12,
    priority: "medium" as const,
  },
  at_location: {
    description: "Arrived at known location",
    cooldownHours: 12,
    priority: "medium" as const,
  },
  vip_email: {
    description: "Email from VIP contact",
    cooldownHours: 0, // Per email
    priority: "high" as const,
  },
  meeting_prep: {
    description: "Big meeting in 1 hour",
    cooldownHours: 0, // Per meeting
    priority: "high" as const,
  },
  morning_checkin: {
    description: "Daily morning check-in",
    cooldownHours: 24,
    priority: "low" as const,
  },
};

export type TriggerId = keyof typeof TRIGGERS;

// Pattern-based triggers (run on cron)
export const patternTriggers = {
  async sleep_deprived(): Promise<TriggerResult> {
    const entries = await getHealthEntriesSince(3);

    if (entries.length < 3) {
      return { shouldFire: false, triggerId: "sleep_deprived" };
    }

    const sleepEntries = entries.filter((e) => e.sleep_hours !== null && e.sleep_hours !== undefined);
    if (sleepEntries.length < 3) {
      return { shouldFire: false, triggerId: "sleep_deprived" };
    }

    const avgSleep = sleepEntries.slice(0, 3).reduce((sum, e) => sum + (e.sleep_hours || 0), 0) / 3;

    if (avgSleep < 5) {
      return {
        shouldFire: true,
        triggerId: "sleep_deprived",
        context: { avgSleep: Math.round(avgSleep * 10) / 10, days: 3 },
      };
    }

    return { shouldFire: false, triggerId: "sleep_deprived" };
  },

  async workout_streak_broken(): Promise<TriggerResult> {
    const entries = await getHealthEntriesSince(7);

    const hasWorkout = entries.some(
      (e) => e.workouts && Array.isArray(e.workouts) && e.workouts.length > 0
    );

    if (!hasWorkout) {
      return {
        shouldFire: true,
        triggerId: "workout_streak_broken",
        context: { daysSinceWorkout: 7 },
      };
    }

    return { shouldFire: false, triggerId: "workout_streak_broken" };
  },

  async low_mood_streak(): Promise<TriggerResult> {
    const entries = await getMoodEntriesSince(3);

    if (entries.length < 3) {
      return { shouldFire: false, triggerId: "low_mood_streak" };
    }

    const avgMood = entries.slice(0, 3).reduce((sum, e) => sum + e.mood, 0) / 3;

    if (avgMood < 2.5) {
      return {
        shouldFire: true,
        triggerId: "low_mood_streak",
        context: { avgMood: Math.round(avgMood * 10) / 10, days: 3 },
      };
    }

    return { shouldFire: false, triggerId: "low_mood_streak" };
  },

  async goal_stale(): Promise<TriggerResult> {
    const staleGoals = await getStaleGoals(14);

    if (staleGoals.length > 0) {
      return {
        shouldFire: true,
        triggerId: "goal_stale",
        context: {
          staleGoals: staleGoals.map((g) => g.title),
          count: staleGoals.length,
        },
      };
    }

    return { shouldFire: false, triggerId: "goal_stale" };
  },

  async gone_quiet(): Promise<TriggerResult> {
    const lastMessage = await getLastUserMessage();

    if (!lastMessage) {
      return {
        shouldFire: true,
        triggerId: "gone_quiet",
        context: { hoursSilent: "unknown" },
      };
    }

    const lastMessageTime = new Date(lastMessage.created_at);
    const hoursSilent = (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);

    if (hoursSilent > 48) {
      return {
        shouldFire: true,
        triggerId: "gone_quiet",
        context: { hoursSilent: Math.round(hoursSilent) },
      };
    }

    return { shouldFire: false, triggerId: "gone_quiet" };
  },

  async doomscroll(): Promise<TriggerResult> {
    const socialMinutes = await getScreenTimeByCategory("social", 1);

    if (socialMinutes > 180) {
      // 3 hours
      return {
        shouldFire: true,
        triggerId: "doomscroll",
        context: {
          minutes: socialMinutes,
          hours: Math.round((socialMinutes / 60) * 10) / 10,
        },
      };
    }

    return { shouldFire: false, triggerId: "doomscroll" };
  },
};

// Event-based triggers (run on data ingestion)
export const eventTriggers = {
  async location_change(location: {
    lat: number;
    lng: number;
    name?: string;
  }): Promise<TriggerResult> {
    // Check for name-based match first (fuzzy)
    if (location.name) {
      const nameLower = location.name.toLowerCase();

      if (nameLower.includes("gym") || nameLower.includes("fitness")) {
        return {
          shouldFire: true,
          triggerId: "at_gym",
          context: { location: location.name, type: "gym" },
        };
      }
    }

    // Check against known locations
    const knownLocs = await getKnownLocations();

    for (const known of knownLocs) {
      const distance = haversineDistance(
        location.lat,
        location.lng,
        known.lat,
        known.lng
      );

      if (distance < known.radius_meters) {
        return {
          shouldFire: true,
          triggerId: "at_location",
          context: { location: known.name, distance: Math.round(distance) },
        };
      }
    }

    return { shouldFire: false, triggerId: "at_location" };
  },

  async email_received(email: {
    from: string;
    subject: string;
  }): Promise<TriggerResult> {
    const vip = await isVipEmail(email.from);

    if (vip) {
      return {
        shouldFire: true,
        triggerId: "vip_email",
        context: {
          from: vip.name,
          relationship: vip.relationship,
          subject: email.subject,
        },
      };
    }

    return { shouldFire: false, triggerId: "vip_email" };
  },

  async meeting_upcoming(meeting: {
    title: string;
    attendeeCount: number;
    startTime: string;
  }): Promise<TriggerResult> {
    const isBigMeeting =
      meeting.attendeeCount >= 3 ||
      meeting.title.toLowerCase().includes("interview") ||
      meeting.title.toLowerCase().includes("investor") ||
      meeting.title.toLowerCase().includes("important");

    if (isBigMeeting) {
      return {
        shouldFire: true,
        triggerId: "meeting_prep",
        context: {
          title: meeting.title,
          attendees: meeting.attendeeCount,
          startTime: meeting.startTime,
        },
      };
    }

    return { shouldFire: false, triggerId: "meeting_prep" };
  },
};

// Haversine formula to calculate distance between two points
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
