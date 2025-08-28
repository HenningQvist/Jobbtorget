import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // behövs för Railway
});

// Testa anslutning direkt vid start
pool.connect()
  .then(client => {
    console.log("✅ Databas ansluten!");
    client.release();
  })
  .catch(err => {
    console.error("❌ Kunde inte ansluta till databasen:", err.message);
  });

export default pool;
