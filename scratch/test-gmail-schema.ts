import 'dotenv/config';
import { corsair } from '../lib/corsair';
import { getSchema } from 'corsair';

async function testSchema() {
  const schema = getSchema(corsair, 'gmail.api.messages.send');
  console.log("================ SCHEMA ================");
  console.log(schema);
  console.log("========================================");
}
testSchema().catch(console.error);
