const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function setBanner() {
  const url = process.env.DATABASE_URL;
  const client = new Client({ connectionString: url });
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    // Update
    const updateRes = await client.query('UPDATE "Tournament" SET "bannerUrl" = $1 WHERE name ILIKE $2 RETURNING id, name', ['/afl-banner.png', '%AFL%']);
    console.log('Updated rows:', updateRes.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

setBanner();
