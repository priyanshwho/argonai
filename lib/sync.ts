import { prisma } from "./db";
import { corsair } from "./corsair";
import crypto from "node:crypto";


export async function syncGmailCache(userId: string) {
  try {
    // Query all Gmail message entities for this user in corsair_entities
    const entities = await prisma.corsairEntity.findMany({
      where: {
        account: {
          tenantId: userId
        },
        entityType: "messages"
      }
    });

    console.info(`Syncing ${entities.length} Gmail cache messages for tenant ${userId}...`);

    for (const entity of entities) {
      const data = entity.data as any;
      if (!data) continue;

      // Extract subject and sender from payload headers safely
      const headers = data.payload?.headers || [];
      const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject";
      const sender = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
      
      // Google internalDate is string timestamp in ms
      const receivedAtMs = parseInt(data.internalDate);
      const receivedAt = isNaN(receivedAtMs) ? new Date() : new Date(receivedAtMs);

      await prisma.gmailCache.upsert({
        where: { gmailId: entity.entityId },
        update: {
          threadId: data.threadId || "",
          subject,
          sender,
          snippet: data.snippet || "",
          receivedAt
        },
        create: {
          userId,
          gmailId: entity.entityId,
          threadId: data.threadId || "",
          subject,
          sender,
          snippet: data.snippet || "",
          receivedAt
        }
      });
    }
    console.info(`Gmail cache sync complete for tenant ${userId}.`);
  } catch (err) {
    console.error(`Error syncing Gmail cache for user ${userId}:`, err);
  }
}

export async function syncCalendarCache(userId: string) {
  try {
    // Query all Google Calendar event entities for this user in corsair_entities
    const entities = await prisma.corsairEntity.findMany({
      where: {
        account: {
          tenantId: userId
        },
        entityType: "events"
      }
    });

    console.info(`Syncing ${entities.length} Google Calendar cache events for tenant ${userId}...`);

    for (const entity of entities) {
      const data = entity.data as any;
      if (!data) continue;

      const title = data.summary || "No Title";
      
      // Google Calendar date vs dateTime parsing
      const startStr = data.start?.dateTime || data.start?.date;
      const endStr = data.end?.dateTime || data.end?.date;

      const startTime = startStr ? new Date(startStr) : new Date();
      const endTime = endStr ? new Date(endStr) : new Date();
      const attendees = (data.attendees || [])
        .map((a: any) => a.email)
        .filter(Boolean);

      await prisma.calendarEvent.upsert({
        where: { eventId: entity.entityId },
        update: {
          title,
          startTime,
          endTime,
          attendees
        },
        create: {
          userId,
          eventId: entity.entityId,
          title,
          startTime,
          endTime,
          attendees
        }
      });
    }
    console.info(`Calendar cache sync complete for tenant ${userId}.`);
  } catch (err) {
    console.error(`Error syncing Calendar cache for user ${userId}:`, err);
  }
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

