import express from "express";
import pool from "../db.js";

const router = express.Router();

/* 📥 Hämta challenges för en användare */
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM challenges
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Fel vid hämtning av challenges:", err.message);
    res.status(500).json({ message: "Kunde inte hämta challenge-resultat" });
  }
});

/* 💾 Spara nytt challenge-resultat */
router.post("/", async (req, res) => {
  console.log("📥 Incoming challenge:", req.body);

  const { user_id, exercise, value } = req.body;

  if (!user_id || !exercise || value == null) {
    return res.status(400).json({ message: "Ogiltig data" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO challenges (user_id, exercise, value)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, exercise, value]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ Fel vid sparande av challenge:", err.message);
    res.status(500).json({ message: "Kunde inte spara challenge-resultat" });
  }
});

export default router;
