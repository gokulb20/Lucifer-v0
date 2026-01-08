// Journal Prompt API - Get today's journal question
import type { NextApiRequest, NextApiResponse } from "next";

// Journal prompts - Lucifer's daily questions
const JOURNAL_PROMPTS = [
  "What's taking up most of your mental space right now?",
  "What's one thing you're avoiding that you know you should do?",
  "Who's been on your mind lately and why?",
  "What would make today a win for you?",
  "What's something you're excited about right now?",
  "What's draining your energy lately?",
  "If you could change one thing about your current situation, what would it be?",
  "What's a conversation you've been putting off?",
  "What did you learn about yourself this week?",
  "What's something you need to hear right now?",
  "Who do you need to reach out to?",
  "What's your gut telling you about something you've been overthinking?",
  "What would you do if you weren't afraid of judgment?",
  "What's one small thing that would make your life better?",
  "What are you grateful for today, honestly?",
  "What's been making you laugh lately?",
  "What's a problem you've been ignoring?",
  "What do you need more of in your life right now?",
  "What do you need less of?",
  "How are you really doing?",
  "What's the next move you need to make?",
  "What's holding you back right now?",
  "What would future you thank you for doing today?",
  "What's something you've been wanting to tell someone?",
  "What's a decision you've been postponing?",
  "What would make you proud of yourself today?",
  "What's your energy level and why?",
  "What's been keeping you up at night?",
  "What's something you need to let go of?",
  "What's the best thing that happened recently?",
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get a prompt based on the day (rotates through prompts)
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const promptIndex = dayOfYear % JOURNAL_PROMPTS.length;

  res.status(200).json({
    prompt: JOURNAL_PROMPTS[promptIndex],
    date: today.toISOString().split("T")[0],
    promptId: promptIndex,
  });
}
