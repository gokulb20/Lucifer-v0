// Context API - Photo sharing from iOS app
import type { NextApiRequest, NextApiResponse } from "next";
import { addToMemory } from "@/lib/memory";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, caption, context } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 required" });
  }

  try {
    // In a real implementation, you would:
    // 1. Store the image (S3, Cloudinary, etc.)
    // 2. Optionally run image analysis (GPT-4 Vision, etc.)
    // 3. Store the context/caption in memory

    // For now, just store the caption/context in memory
    if (process.env.MEM0_API_KEY && (caption || context)) {
      await addToMemory([
        {
          role: "user",
          content: `Shared a photo${caption ? `: "${caption}"` : ""}${context ? `. Context: ${context}` : ""}`,
        },
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Photo received",
      // In production, return the stored image URL
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return res.status(500).json({ error: "Failed to process photo" });
  }
}
