const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Starting Supabase Database Setup...');
  console.log('Database URL check:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Executing schema.sql...');
    await client.query(schemaSql);
    console.log('✅ Schema executed successfully');

    console.log('\n🎉 Supabase setup complete!');
    console.log('Next step: Run "node seed.js" to populate initial data\n');

  } catch (error) {
    console.error('❌ Setup failed!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Stack Trace:', error.stack);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (e) { }
  }
}

setupDatabase();
