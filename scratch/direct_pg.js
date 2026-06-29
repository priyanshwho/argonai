const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env or .env.local in workspace root
const envFiles = ['.env.local', '.env', '.env.production'];
for (const file of envFiles) {
  const p = path.resolve(__dirname, '..', file);
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
    if (process.env.DATABASE_URL) {
      break;
    }
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM "user"');
    console.log('Users:');
    for (const u of res.rows) {
      console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
