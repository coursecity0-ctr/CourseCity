const { Pool } = require('pg');
require('dotenv').config();

// Supabase / PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error acquiring client', err.stack);
  }
  console.log('✅ Connected to Supabase (PostgreSQL) successfully');
  release();
});

// Export a query function for compatibility with existing code
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
