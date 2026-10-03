const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
let dbMode = null; // 'postgres' or 'pg-mem'

/**
 * Initializes database connection.
 * Connects via `pg` (node-postgres) if DATABASE_URL or PGHOST is configured.
 * If not available, uses lightweight PostgreSQL engine (pg-mem) to run with minimal RAM usage.
 */
async function initDatabase() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const connectionString = process.env.DATABASE_URL;
  const hasPgEnv = Boolean(connectionString || process.env.PGHOST);

  if (hasPgEnv && process.env.FORCE_EMBEDDED !== 'true') {
    try {
      const { Pool } = require('pg');
      const isLocal = connectionString ? connectionString.includes('localhost') : false;
      
      pool = new Pool(
        connectionString
          ? {
              connectionString,
              ssl: isLocal ? false : { rejectUnauthorized: false },
            }
          : {
              host: process.env.PGHOST || 'localhost',
              port: parseInt(process.env.PGPORT || '5432', 10),
              user: process.env.PGUSER || 'postgres',
              password: process.env.PGPASSWORD || 'postgres',
              database: process.env.PGDATABASE || 'ticket_system',
              ssl: false,
            }
      );

      // Test connection
      await pool.query('SELECT 1');
      dbMode = 'postgres';
      console.log('✅ Connected to external PostgreSQL database successfully.');

      // Ensure schema exists
      await pool.query(schemaSql);
      console.log('✅ Database schema verified.');
      return;
    } catch (err) {
      console.warn('⚠️ External PostgreSQL connection failed:', err.message);
      console.log('🔄 Falling back to lightweight in-memory PostgreSQL engine (pg-mem)...');
    }
  }

  // Lightweight in-memory PostgreSQL engine (pg-mem) for standalone / low-memory deployment
  try {
    const { newDb } = require('pg-mem');
    const memDb = newDb();

    // Execute schema
    memDb.public.none(schemaSql);

    // Seed initial records if seed.sql exists
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      memDb.public.none(seedSql);
    }

    const pgAdapter = memDb.adapters.createPg();
    pool = new pgAdapter.Pool();
    dbMode = 'pg-mem';
    console.log('✅ Initialized lightweight PostgreSQL database (pg-mem, <20MB RAM).');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    throw err;
  }
}

/**
 * Execute a query with parameters.
 */
async function query(text, params = []) {
  if (!pool) {
    await initDatabase();
  }
  return pool.query(text, params);
}

/**
 * Execute raw multi-statement SQL script.
 */
async function exec(sql) {
  if (!pool) {
    await initDatabase();
  }
  return pool.query(sql);
}

module.exports = {
  initDatabase,
  query,
  exec,
  getDbMode: () => dbMode,
};
