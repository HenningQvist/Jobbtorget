// routes/visits.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// Logga ett besök (max 1 per IP per dag)
router.post("/", async (req, res) => {
  try {
    const ip = req.ip; // Hämtar användarens IP

    await pool.query(`
      INSERT INTO visits (visited_at, ip_address)
      SELECT NOW(), $1
      WHERE NOT EXISTS (
        SELECT 1 FROM visits
        WHERE visited_at::date = CURRENT_DATE AND ip_address = $1
      )
    `, [ip]);

    res.json({ success: true });
  } catch (err) {
    console.error("Fel vid loggning av besök:", err);
    res.status(500).json({ error: "Kunde inte logga besök" });
  }
});

// Hämta antal besök senaste 7 dagarna
router.get("/count", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS totalVisits FROM visits WHERE visited_at >= NOW() - INTERVAL '7 days'"
    );
    res.json({ totalVisits: parseInt(result.rows[0].totalvisits, 10) });
  } catch (err) {
    console.error("Fel vid hämtning av besök:", err);
    res.status(500).json({ error: "Kunde inte hämta besök" });
  }
});
// routes/visits.js
router.get("/per-day", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(visited_at, 'YYYY-MM-DD') AS date, 
        COUNT(*) AS count
      FROM visits
      WHERE visited_at >= NOW() - INTERVAL '6 months'
      GROUP BY date
      ORDER BY date ASC
    `);
    res.json(result.rows); // [{ date: '2025-04-01', count: 5 }, ...]
  } catch (err) {
    console.error("Fel vid hämtning av besök per dag:", err);
    res.status(500).json({ error: "Kunde inte hämta besök per dag" });
  }
});

export default router;
