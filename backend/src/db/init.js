import { query } from "./pool.js";

const schemaSql = `
  CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    equipment TEXT[] NOT NULL DEFAULT '{}',
    location VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
      CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
  );

  CREATE INDEX IF NOT EXISTS idx_reservations_room_time
    ON reservations (room_id, start_time, end_time)
    WHERE status = 'confirmed';
`;

const seedSql = `
  INSERT INTO rooms (name, capacity, equipment, location)
  VALUES
    ('Salle Alpha', 8, ARRAY['ecran', 'visio'], 'Batiment A - 1er etage'),
    ('Salle Beta', 16, ARRAY['ecran', 'tableau'], 'Batiment A - 2e etage'),
    ('Salle Gamma', 30, ARRAY['ecran', 'sonorisation'], 'Batiment B - RDC')
  ON CONFLICT (name) DO NOTHING;
`;

async function waitForDatabase(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await query("SELECT 1");
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export async function initDatabase() {
  await waitForDatabase();
  await query(schemaSql);
  await query(seedSql);
}
