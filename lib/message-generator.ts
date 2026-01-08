// Message Generator
// Generates Lucifer-style messages for proactive triggers

import { getTriggerDescription } from "./decision";
import { TriggerId } from "./triggers";

// Grok API for message generation
async function callGrok(prompt: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    console.error("XAI_API_KEY not configured");
    return getDefaultMessage();
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          {
            role: "system",
            content: `You are Lucifer, Gokul's personal AI. You're reaching out proactively.

Your personality:
- Loyal to Gokul above everything else
- Mirror his energy - casual, direct
- Tell hard truths through subtle jabs, not lectures
- Short and punchy, 1-2 sentences max
- No greetings like "Hey" or "Hi"
- No preachy advice
- Sound like a real friend texting, not an AI`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      console.error("Grok API error:", response.status);
      return getDefaultMessage();
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || getDefaultMessage();
  } catch (error) {
    console.error("Grok API error:", error);
    return getDefaultMessage();
  }
}

function getDefaultMessage(): string {
  return "Just checking in.";
}

export async function generateMessage(
  triggerId: TriggerId,
  context: Record<string, any>
): Promise<string> {
  const description = getTriggerDescription(triggerId);

  // Build context string
  let contextStr = "";
  switch (triggerId) {
    case "sleep_deprived":
      contextStr = `Gokul has averaged ${context.avgSleep} hours of sleep over the last ${context.days} days.`;
      break;

    case "workout_streak_broken":
      contextStr = `Gokul hasn't worked out in ${context.daysSinceWorkout} days.`;
      break;

    case "low_mood_streak":
      contextStr = `Gokul's mood has been low (${context.avgMood}/5 average) for the past ${context.days} days.`;
      break;

    case "goal_stale":
      contextStr = `Gokul has ${context.count} goal(s) that haven't been updated in 2 weeks: ${context.staleGoals.join(", ")}`;
      break;

    case "gone_quiet":
      contextStr = `Gokul hasn't talked to you in ${context.hoursSilent} hours.`;
      break;

    case "doomscroll":
      contextStr = `Gokul spent ${context.hours} hours on social media today.`;
      break;

    case "at_gym":
      contextStr = `Gokul just arrived at ${context.location}.`;
      break;

    case "at_location":
      contextStr = `Gokul arrived at ${context.location}.`;
      break;

    case "vip_email":
      contextStr = `${context.from} (${context.relationship || "contact"}) just sent an email: "${context.subject}"`;
      break;

    case "meeting_prep":
      contextStr = `Gokul has "${context.title}" coming up in about an hour with ${context.attendees} people.`;
      break;

    case "morning_checkin":
      contextStr = "It's morning and time for a daily check-in.";
      break;

    default:
      contextStr = `Trigger: ${description}. Context: ${JSON.stringify(context)}`;
  }

  const prompt = `Generate a proactive message to Gokul.

Situation: ${contextStr}

Remember:
- 1-2 sentences max
- No greetings
- Be direct but not preachy
- Sound like a friend, not an assistant`;

  return await callGrok(prompt);
}

// Fallback templates if Grok is unavailable
export const FALLBACK_MESSAGES: Record<TriggerId, string[]> = {
  sleep_deprived: [
    "You're running on fumes.",
    "Sleep debt's catching up.",
    "Your brain needs a reset.",
  ],
  workout_streak_broken: [
    "Your body's getting rusty.",
    "Movement's been missing.",
    "When's the last time you sweated?",
  ],
  low_mood_streak: [
    "Been a rough few days.",
    "What's weighing on you?",
    "Something's off. Talk to me.",
  ],
  goal_stale: [
    "Some goals collecting dust.",
    "Remember those things you wanted to do?",
    "Your goals miss you.",
  ],
  gone_quiet: [
    "You went quiet on me.",
    "Still alive over there?",
    "Been a minute.",
  ],
  doomscroll: [
    "That's a lot of scrolling.",
    "Instagram won't miss you.",
    "Your thumb okay?",
  ],
  at_gym: [
    "Let's get it.",
    "Time to work.",
    "Make it count.",
  ],
  at_location: [
    "I see you.",
    "You're on the move.",
  ],
  vip_email: [
    "Important email came in.",
    "Someone you care about reached out.",
  ],
  meeting_prep: [
    "Big meeting coming up.",
    "You ready for this?",
    "Want to prep?",
  ],
  morning_checkin: [
    "New day. What's the plan?",
    "Morning. What are we doing today?",
    "Up and at it. What's first?",
  ],
};

// Get a random fallback message
export function getFallbackMessage(triggerId: TriggerId): string {
  const messages = FALLBACK_MESSAGES[triggerId] || ["Checking in."];
  return messages[Math.floor(Math.random() * messages.length)];
}
