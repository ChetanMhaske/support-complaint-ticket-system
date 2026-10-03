const fs = require('fs');
const path = require('path');
const { initDatabase, exec, query } = require('../config/db');

async function run() {
  try {
    console.log('--- Initializing Database ---');
    await initDatabase();

    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Applying schema...');
    await exec(schemaSql);

    console.log('Checking existing records...');
    const countRes = await query('SELECT COUNT(*) as count FROM tickets');
    const count = parseInt(countRes.rows[0].count, 10);

    if (count === 0) {
      console.log('Seeding initial tickets...');
      await exec(seedSql);
      console.log('✅ Seed completed successfully.');
    } else {
      console.log(`Table already has ${count} tickets. Skipping seed. (Run with --reset to force reseed)`);
      if (process.argv.includes('--reset')) {
        console.log('Resetting tickets table...');
        await exec('TRUNCATE TABLE tickets RESTART IDENTITY;');
        await exec(seedSql);
        console.log('✅ Reset and reseed completed.');
      }
    }

    const finalRes = await query('SELECT id, title, status, priority FROM tickets');
    console.log(`Current tickets (${finalRes.rows.length}):`);
    console.table(finalRes.rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
  }
}

run();
