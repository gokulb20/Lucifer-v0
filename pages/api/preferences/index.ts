// Preferences API - Store user preferences
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

// Preference questions for building profile
const PREFERENCE_QUESTIONS = [
  { id: "morning_night", question: "Morning person or night owl?", options: ["morning", "night"] },
  { id: "coffee_tea", question: "Coffee or tea?", options: ["coffee", "tea", "neither"] },
  { id: "introvert_extrovert", question: "Introvert or extrovert?", options: ["introvert", "extrovert", "ambivert"] },
  { id: "planner_spontaneous", question: "Planner or spontaneous?", options: ["planner", "spontaneous", "mix"] },
  { id: "city_nature", question: "City or nature?", options: ["city", "nature", "both"] },
  { id: "work_style", question: "Work alone or with others?", options: ["alone", "others", "depends"] },
  { id: "risk_tolerance", question: "Risk taker or play it safe?", options: ["risk", "safe", "calculated"] },
  { id: "decision_style", question: "Head or heart for decisions?", options: ["head", "heart", "both"] },
  { id: "stress_response", question: "Talk it out or process alone when stressed?", options: ["talk", "alone", "depends"] },
  { id: "learning_style", question: "Learn by doing or reading?", options: ["doing", "reading", "watching"] },
  { id: "communication", question: "Text or call?", options: ["text", "call", "depends"] },
  { id: "schedule", question: "Busy schedule or lots of free time?", options: ["busy", "free", "balanced"] },
  { id: "feedback", question: "Direct feedback or gentle?", options: ["direct", "gentle"] },
  { id: "motivation", question: "Motivated by goals or deadlines?", options: ["goals", "deadlines", "neither"] },
  { id: "social_battery", question: "Large groups or small gatherings?", options: ["large", "small", "one-on-one"] },
];

// In-memory store
let preferences: Record<string, string> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Return preferences and next unanswered question
    const answeredIds = Object.keys(preferences);
    const nextQuestion = PREFERENCE_QUESTIONS.find((q) => !answeredIds.includes(q.id));

    return res.status(200).json({
      preferences,
      nextQuestion: nextQuestion || null,
      progress: {
        answered: answeredIds.length,
        total: PREFERENCE_QUESTIONS.length,
      },
    });
  }

  if (req.method === "POST") {
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({ error: "questionId and answer required" });
    }

    const question = PREFERENCE_QUESTIONS.find((q) => q.id === questionId);
    if (!question) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    preferences[questionId] = answer;

    // Store in memory
    if (process.env.MEM0_API_KEY) {
      await addToMemory([
        { role: "assistant", content: question.question },
        { role: "user", content: answer },
      ]);
    }

    // Get next question
    const answeredIds = Object.keys(preferences);
    const nextQuestion = PREFERENCE_QUESTIONS.find((q) => !answeredIds.includes(q.id));

    return res.status(200).json({
      saved: { questionId, answer },
      nextQuestion: nextQuestion || null,
      progress: {
        answered: answeredIds.length,
        total: PREFERENCE_QUESTIONS.length,
      },
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
