import { Pool } from 'pg';

// Database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize database schema
export async function initDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('furniture', 'crop', 'tool', 'fish')),
        rarity VARCHAR(50) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
        price INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        level INTEGER DEFAULT 1,
        gold INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed sample data (optional, for development)
export async function seedDatabase() {
  const client = await pool.connect();

  try {
    const { rows } = await client.query('SELECT COUNT(*) FROM items');

    if (parseInt(rows[0].count) > 0) {
      console.log('⏭️  Database already has data, skipping seed');
      return;
    }

    await client.query(`
      INSERT INTO items (id, name, icon, category, rarity, price) VALUES
      ('item_1', 'Cozy Armchair', '🛋️', 'furniture', 'common', 150),
      ('item_2', 'Tomato Seeds', '🍅', 'crop', 'common', 10),
      ('item_3', 'Golden Fishing Rod', '🎣', 'tool', 'epic', 500),
      ('item_4', 'Rainbow Trout', '🐟', 'fish', 'rare', 75)
    `);

    console.log('✅ Database seeded with sample data');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    client.release();
  }
}
