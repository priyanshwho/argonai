import { prisma } from "./db";
import { corsair } from "./corsair";
import crypto from "node:crypto";


export async function syncGmailCache(userId: string) {
  console.info(`[DEPRECATED] syncGmailCache: Webhook syncs are now handled natively by Corsair via corsair_entities. No secondary caching required for user: ${userId}`);
}

export async function syncCalendarCache(userId: string) {
  console.info(`[DEPRECATED] syncCalendarCache: Webhook syncs are now handled natively by Corsair via corsair_entities. No secondary caching required for user: ${userId}`);
}

export async function setupGmailWatch(userId: string) {
  try {
    console.info(`Setting up Gmail webhook watch for tenant ${userId}...`);
    const gmailToken = await corsair.withTenant(userId).gmail.keys.get_access_token();

    if (!gmailToken) {
      console.warn(`No Gmail access token found for tenant ${userId}, skipping watch setup.`);
      return;
    }

    const pubSubTopic = process.env.GOOGLE_PUBSUB_TOPIC || "projects/corsair-demo-499718/topics/corsair-webhooks";
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gmailToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicName: pubSubTopic,
        labelIds: ["INBOX"],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.info(`Gmail watch registered successfully for ${userId}:`, data);
    } else {
      const errText = await res.text();
      console.error(`Failed to register Gmail watch for ${userId}:`, errText);
    }
  } catch (err) {
    console.error(`Error registering Gmail watch for ${userId}:`, err);
  }
}

export async function setupCalendarWatch(userId: string) {
  try {
    console.info(`Setting up Google Calendar webhook watch for tenant ${userId}...`);
    const calToken = await corsair.withTenant(userId).googlecalendar.keys.get_access_token();

    if (!calToken) {
      console.warn(`No Calendar access token found for tenant ${userId}, skipping watch setup.`);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://confining-cognitive-shudder.ngrok-free.dev";
    const webhookUrl = `${appUrl}/api/webhooks?tenant_id=${userId}`;
    const channelId = crypto.randomUUID();

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events/watch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${calToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.info(`Calendar watch registered successfully for ${userId}:`, data);
    } else {
      const errText = await res.text();
      console.error(`Failed to register Calendar watch for ${userId}:`, errText);
    }
  } catch (err) {
    console.error(`Error registering Calendar watch for ${userId}:`, err);
  }
}

/** @deprecated Use setupGmailWatch or setupCalendarWatch directly */
export async function setupWatches(userId: string) {
  await setupGmailWatch(userId);
  await setupCalendarWatch(userId);
}

