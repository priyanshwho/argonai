import { corsair } from '../lib/corsair';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const tenantId = 'tyDoX48xYCjXOtPGBhZ76isww2RtdQEP';
  console.log('Testing Corsair DB client calls with correct tenantId:', tenantId);
  
  try {
    const messages = await corsair.withTenant(tenantId).gmail.db.messages.list({});
    console.log('Gmail DB messages count:', messages?.length);
    if (messages && messages.length > 0) {
      console.log('Sample message:', JSON.stringify(messages[0], null, 2));
    }
  } catch (err) {
    console.error('Error fetching Gmail messages from DB:', err);
  }

  try {
    const events = await corsair.withTenant(tenantId).googlecalendar.db.events.list({});
    console.log('Calendar DB events count:', events?.length);
    if (events && events.length > 0) {
      console.log('Sample event:', JSON.stringify(events[0], null, 2));
    }
  } catch (err) {
    console.error('Error fetching Calendar events from DB:', err);
  }
}

main().catch(console.error);
