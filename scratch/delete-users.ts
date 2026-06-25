import { prisma } from '../lib/db';

async function main() {
  console.log('Starting database cleanup...');
  
  // 1. Delete all user records (cascading deletes sessions, accounts, conversations, messages, gmailCaches, calendarEvents)
  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`Deleted ${deletedUsers.count} users and all cascading relationships.`);

  // 2. Delete all connected Corsair accounts (cascading deletes entities and events)
  const deletedCorsairAccounts = await prisma.corsairAccount.deleteMany({});
  console.log(`Deleted ${deletedCorsairAccounts.count} connected Corsair accounts.`);

  // 3. Clear any remaining sessions or verification tokens if not cascaded
  const deletedSessions = await prisma.session.deleteMany({});
  console.log(`Cleared ${deletedSessions.count} sessions.`);
  
  const deletedVerification = await prisma.verification.deleteMany({});
  console.log(`Cleared ${deletedVerification.count} verification records.`);

  console.log('Database successfully cleaned up!');
}

main()
  .catch((err) => {
    console.error('Cleanup failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
