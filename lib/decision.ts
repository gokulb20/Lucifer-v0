// Decision Engine
// Determines whether a trigger should actually fire based on cooldowns, quiet hours, etc.

import { getLastTriggerFire } from "./supabase";
import { TRIGGERS, TriggerId } from "./triggers";

export interface DecisionResult {
  shouldFire: boolean;
  reason?: string;
}

// Quiet hours configuration (don't disturb at night unless high priority)
const QUIET_HOURS = {
  start: 23, // 11 PM
  end: 7, // 7 AM
};

export async function shouldFireTrigger(
  triggerId: TriggerId,
  context?: Record<string, any>
): Promise<DecisionResult> {
  const trigger = TRIGGERS[triggerId];

  if (!trigger) {
    return { shouldFire: false, reason: "Unknown trigger" };
  }

  // Check cooldown
  const lastFire = await getLastTriggerFire(triggerId);

  if (lastFire && trigger.cooldownHours > 0) {
    const lastFireTime = new Date(lastFire.fired_at);
    const hoursSinceLastFire = (Date.now() - lastFireTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastFire < trigger.cooldownHours) {
      return {
        shouldFire: false,
        reason: `Cooldown: ${Math.round(trigger.cooldownHours - hoursSinceLastFire)}h remaining`,
      };
    }
  }

  // Check quiet hours (skip for high priority)
  if (trigger.priority !== "high") {
    const now = new Date();
    const hour = now.getHours();

    const isQuietHours =
      hour >= QUIET_HOURS.start || hour < QUIET_HOURS.end;

    if (isQuietHours) {
      return {
        shouldFire: false,
        reason: `Quiet hours (${QUIET_HOURS.start}:00 - ${QUIET_HOURS.end}:00)`,
      };
    }
  }

  // Check for per-event uniqueness (vip_email, meeting_prep)
  if (triggerId === "vip_email" && context?.subject) {
    const recentFires = await checkRecentTriggerWithContext(triggerId, "subject", context.subject, 24);
    if (recentFires) {
      return {
        shouldFire: false,
        reason: "Already notified about this email",
      };
    }
  }

  if (triggerId === "meeting_prep" && context?.title) {
    const recentFires = await checkRecentTriggerWithContext(triggerId, "title", context.title, 24);
    if (recentFires) {
      return {
        shouldFire: false,
        reason: "Already notified about this meeting",
      };
    }
  }

  return { shouldFire: true };
}

// Check if we recently fired a trigger with specific context
async function checkRecentTriggerWithContext(
  triggerId: string,
  contextKey: string,
  contextValue: string,
  hoursBack: number
): Promise<boolean> {
  const lastFire = await getLastTriggerFire(triggerId);

  if (!lastFire) return false;

  const lastFireTime = new Date(lastFire.fired_at);
  const hoursSinceLastFire = (Date.now() - lastFireTime.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastFire > hoursBack) return false;

  // Check if context matches
  if (lastFire.context && lastFire.context[contextKey] === contextValue) {
    return true;
  }

  return false;
}

// Get trigger priority
export function getTriggerPriority(triggerId: TriggerId): "low" | "medium" | "high" {
  return TRIGGERS[triggerId]?.priority || "medium";
}

// Get trigger description for message generation
export function getTriggerDescription(triggerId: TriggerId): string {
  return TRIGGERS[triggerId]?.description || triggerId;
}
