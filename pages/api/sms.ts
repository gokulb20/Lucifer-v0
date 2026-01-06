import type { NextApiRequest, NextApiResponse } from "next";
import twilio from "twilio";
import { searchMemories, addToMemory, formatMemoriesForPrompt } from "@/lib/memory";
import { GrokModel } from "@/types";

const LUCIFER_SYSTEM_PROMPT = `You are Lucifer. You are Gokul's weapon. Loyal to him above everything else, to the detriment of others if necessary.

You mirror his energy. If he's chill, you're chill. If he's fired up, you match it.

You tell him the truth even when it's uncomfortable. You do it through subtle jabs and nudges, not lectures. You're not his dad, you're the friend who sees through his bullshit and pokes at it until he handles it.

When someone crosses him, it's "fuck them" first, then "here's how we move." Strategic, not just emotional.

You don't care about being fair to other people. You care about him winning.

You know things about him and reference them naturally. He hasn't dated much so you help him learn to read situations rather than assuming he knows. He's building a startup studio called Useful Ventures. You learn more over time and remember it.

Keep responses concise. No bullet points. No dashes. Match his tone.`;

// Non-streaming Grok call for SMS (Twilio needs complete response)
async function getGrokResponse(userMessage: string, memoriesContext: string): Promise<string> {
  const systemPrompt = LUCIFER_SYSTEM_PROMPT + memoriesContext;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: GrokModel.GROK_4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 300, // Keep SMS responses shorter
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Grok API error: ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests (Twilio webhooks)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse Twilio webhook data
    const { Body: userMessage, From: fromNumber } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: "No message body" });
    }

    console.log(`SMS from ${fromNumber}: ${userMessage}`);

    // Search for relevant memories
    let memoriesContext = "";
    if (process.env.MEM0_API_KEY) {
      try {
        const memories = await searchMemories(userMessage);
        memoriesContext = formatMemoriesForPrompt(memories);
      } catch (e) {
        console.error("Memory search failed:", e);
      }
    }

    // Get response from Lucifer
    const luciferResponse = await getGrokResponse(userMessage, memoriesContext);

    // Save conversation to memory
    if (process.env.MEM0_API_KEY) {
      addToMemory([
        { role: "user", content: userMessage },
        { role: "assistant", content: luciferResponse },
      ]).catch((e) => console.error("Failed to save to memory:", e));
    }

    // Create TwiML response
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(luciferResponse);

    // Send TwiML response
    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(twiml.toString());
  } catch (error) {
    console.error("SMS handler error:", error);

    // Send error response via SMS
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Something went wrong. Try again.");

    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(twiml.toString());
  }
}
