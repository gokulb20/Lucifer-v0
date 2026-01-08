// Push Notification System
// Sends notifications via APNs (iOS) with SMS fallback

import { getDeviceTokens, logTrigger } from "./supabase";
import { TriggerId } from "./triggers";

interface PushPayload {
  triggerId: TriggerId;
  context?: Record<string, any>;
}

// Send push notification
export async function sendPush(
  message: string,
  priority: "low" | "medium" | "high",
  payload?: PushPayload
): Promise<{ success: boolean; method: string }> {
  // Try APNs first
  const apnsResult = await sendAPNs(message, priority, payload);

  if (apnsResult.success) {
    return { success: true, method: "apns" };
  }

  // Fallback to SMS
  console.log("APNs failed, falling back to SMS");
  const smsResult = await sendSMS(message);

  if (smsResult.success) {
    return { success: true, method: "sms" };
  }

  console.error("All delivery methods failed");
  return { success: false, method: "none" };
}

// Apple Push Notification Service
async function sendAPNs(
  message: string,
  priority: "low" | "medium" | "high",
  payload?: PushPayload
): Promise<{ success: boolean }> {
  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY;
  const bundleId = process.env.APNS_BUNDLE_ID || "com.gokul.lucifer";

  if (!teamId || !keyId || !privateKey) {
    console.log("APNs not configured");
    return { success: false };
  }

  const devices = await getDeviceTokens();

  if (devices.length === 0) {
    console.log("No device tokens registered");
    return { success: false };
  }

  try {
    // Generate JWT for APNs
    const jwt = await generateAPNsJWT(teamId, keyId, privateKey);

    const isProduction = process.env.NODE_ENV === "production";
    const apnsHost = isProduction
      ? "api.push.apple.com"
      : "api.sandbox.push.apple.com";

    for (const device of devices) {
      const response = await fetch(
        `https://${apnsHost}/3/device/${device.token}`,
        {
          method: "POST",
          headers: {
            Authorization: `bearer ${jwt}`,
            "apns-topic": bundleId,
            "apns-priority": priority === "high" ? "10" : "5",
            "apns-push-type": "alert",
          },
          body: JSON.stringify({
            aps: {
              alert: {
                title: "Lucifer",
                body: message,
              },
              sound: priority === "high" ? "default" : undefined,
              badge: 1,
            },
            ...payload,
          }),
        }
      );

      if (!response.ok) {
        console.error("APNs error:", response.status, await response.text());
        continue;
      }

      console.log("Push sent successfully to device:", device.token.slice(0, 10) + "...");
    }

    return { success: true };
  } catch (error) {
    console.error("APNs error:", error);
    return { success: false };
  }
}

// Generate JWT for APNs authentication
async function generateAPNsJWT(
  teamId: string,
  keyId: string,
  privateKey: string
): Promise<string> {
  // JWT Header
  const header = {
    alg: "ES256",
    kid: keyId,
  };

  // JWT Payload
  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  // For production, you'd use a proper JWT library with ES256 signing
  // This is a simplified version - in production use 'jsonwebtoken' with the key

  // Base64URL encode
  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  // In production, sign with ES256 using the private key
  // For now, this is a placeholder - you'll need to add proper JWT signing
  const signature = "signature_placeholder";

  return `${base64Header}.${base64Payload}.${signature}`;
}

// Twilio SMS Fallback
async function sendSMS(message: string): Promise<{ success: boolean }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const toPhone = process.env.GOKUL_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone || !toPhone) {
    console.log("Twilio not configured");
    return { success: false };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          From: fromPhone,
          To: toPhone,
          Body: `Lucifer: ${message}`,
        }),
      }
    );

    if (!response.ok) {
      console.error("Twilio error:", response.status, await response.text());
      return { success: false };
    }

    console.log("SMS sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Twilio error:", error);
    return { success: false };
  }
}

// Full delivery flow: generate message, send, log
export async function deliverTrigger(
  triggerId: TriggerId,
  context: Record<string, any>,
  message: string,
  priority: "low" | "medium" | "high"
): Promise<void> {
  const result = await sendPush(message, priority, { triggerId, context });

  // Log to database
  await logTrigger(triggerId, context, message, result.method);

  console.log(`Trigger ${triggerId} delivered via ${result.method}: "${message}"`);
}

// Check if push is configured
export function isPushConfigured(): boolean {
  const hasAPNs = !!(
    process.env.APNS_TEAM_ID &&
    process.env.APNS_KEY_ID &&
    process.env.APNS_PRIVATE_KEY
  );

  const hasTwilio = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER &&
    process.env.GOKUL_PHONE_NUMBER
  );

  return hasAPNs || hasTwilio;
}
