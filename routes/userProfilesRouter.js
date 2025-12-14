import express from "express";
import pool from "../db.js"; // PostgreSQL-anslutning
const router = express.Router();

// Hämta profil
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM user_profiles WHERE user_id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profil inte hittad" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte hämta profil" });
  }
});

// Spara / uppdatera profil
router.post("/", async (req, res) => {
  const { userId, name, age, gender, height, weight, bmi, avatar } = req.body;
  if (!userId || !name || !age) {
    return res.status(400).json({ error: "Saknade obligatoriska fält" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_profiles (user_id, name, age, gender, height, weight, bmi, avatar)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id) DO UPDATE
       SET name=$2, age=$3, gender=$4, height=$5, weight=$6, bmi=$7, avatar=$8
       RETURNING *`,
      [userId, name, age, gender, height, weight, bmi, avatar]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte spara profil" });
  }
});

export default router;
