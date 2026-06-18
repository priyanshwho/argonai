import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { corsair } from '@/lib/corsair';
import { prisma } from '@/lib/db';
import crypto from 'node:crypto';

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const tenantClient = corsair.withTenant(session.user.id);

    // Step 1: Try direct cache from Corsair DB client first
    let rawEvents = await tenantClient.googlecalendar.db.events.list({});
    let formattedEvents: any[] = [];
    
    // Step 2: Fall back to live API if cache is empty
    if (!rawEvents || rawEvents.length === 0) {
      console.info('Calendar DB cache empty — falling back to live API');
      const apiResponse = await tenantClient.googlecalendar.api.events.getMany({
        calendarId: 'primary',
        maxResults: 20,
      });

      const items = apiResponse.items || [];
      
      const corsairAccount = await prisma.corsairAccount.findFirst({
        where: {
          tenantId: session.user.id,
          integrationId: "googlecalendar",
        },
      });

      if (corsairAccount) {
        // Run cache writes concurrently in background
        Promise.all(
          items.map(async (item: any) => {
            try {
              const existing = await prisma.corsairEntity.findFirst({
                where: {
                  accountId: corsairAccount.id,
                  entityId: item.id,
                },
              });

              if (existing) {
                await prisma.corsairEntity.update({
                  where: { id: existing.id },
                  data: {
                    version: String(Date.now()),
                    data: item,
                  },
                });
              } else {
                await prisma.corsairEntity.create({
                  data: {
                    id: crypto.randomUUID(),
                    accountId: corsairAccount.id,
                    entityId: item.id,
                    entityType: "events",
                    version: String(Date.now()),
                    data: item,
                  },
                });
              }
            } catch (cacheErr) {
              console.error(`Failed to cache event ${item.id}:`, cacheErr);
            }
          })
        ).catch(err => {
          console.error('Failed to run batch Calendar cache write:', err);
        });
      }

      formattedEvents = items.map((item: any) => {
        const startStr = item.start?.dateTime || item.start?.date;
        const endStr = item.end?.dateTime || item.end?.date;
        const startTime = startStr ? new Date(startStr).toISOString() : new Date().toISOString();
        const endTime = endStr ? new Date(endStr).toISOString() : new Date().toISOString();
        const attendees = (item.attendees || [])
          .map((a: any) => a.email)
          .filter(Boolean);

        return {
          id: item.id,
          eventId: item.id,
          title: item.summary || "No Title",
          startTime,
          endTime,
          attendees,
        };
      });
    } else {
      // Map CorsairEntity database format into CalendarItem representation
      formattedEvents = rawEvents.map((evt: any) => {
        const data = evt.data || {};
        const startStr = data.start?.dateTime || data.start?.date;
        const endStr = data.end?.dateTime || data.end?.date;
        const startTime = startStr ? new Date(startStr).toISOString() : new Date().toISOString();
        const endTime = endStr ? new Date(endStr).toISOString() : new Date().toISOString();
        const attendees = (data.attendees || [])
          .map((a: any) => a.email)
          .filter(Boolean);

        return {
          id: evt.id,
          eventId: evt.entityId,
          title: data.summary || "No Title",
          startTime,
          endTime,
          attendees,
        };
      });
    }

    formattedEvents.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return NextResponse.json({ events: formattedEvents });
  } catch (err) {
    console.error('Failed to retrieve calendar events via Corsair DB:', err);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
