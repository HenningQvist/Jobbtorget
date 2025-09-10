// db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

let pool;

if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
  // Produktion (Railway)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  // Lokal utveckling
  pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });
}

// Initiera activities-tabellen om den inte finns
export const initActivitiesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Tabellen 'activities' finns nu eller har skapats");
  } catch (err) {
    console.error("❌ Kunde inte skapa tabellen 'activities':", err);
  }
};

export default pool;
