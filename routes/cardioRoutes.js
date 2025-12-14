// routes/cardioRoutes.js
import express from "express";
import pool from "../db.js"; // PostgreSQL-anslutning
const router = express.Router();

// 🔹 Hämta cardio-testresultat för en användare
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM cardio_results WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );

    // ⚡ Returnera alltid array, även om den är tom
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fel vid hämtning av cardio-resultat:", err);
    res.status(500).json({ error: "Kunde inte hämta cardio-resultat" });
  }
});

// 🔹 Spara / uppdatera cardio-testresultat
router.post("/", async (req, res) => {
  const { userId, testKey, value, score, date } = req.body;

  // Validering av obligatoriska fält
  if (!userId || !testKey || value == null || score == null || !date) {
    return res.status(400).json({ error: "Saknade obligatoriska fält" });
  }

  try {
    // Skapa nytt resultat i databasen
    const result = await pool.query(
      `INSERT INTO cardio_results (user_id, test_key, value, score, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, testKey, value, score, date]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Fel vid sparande av cardio-resultat:", err);
    res.status(500).json({ error: "Kunde inte spara cardio-resultat" });
  }
});

export default router;
