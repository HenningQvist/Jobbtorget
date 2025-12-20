import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * --------------------
 * 1️⃣ Hämta alla PI-resultat (alla användare)
 * --------------------
 */
router.get("/all", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        pi.id,
        pi.user_id,
        pi.exercise,
        pi.profile,
        pi.result,   -- 👈 faktiska reps / kg / sek
        pi.pi,       -- 👈 beräknat PI
        pi.created_at,
        up.name,
        up.avatar
      FROM pi_results pi
      LEFT JOIN user_profiles up
        ON pi.user_id::text = up.id::text
      ORDER BY pi.created_at DESC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Fel vid hämtning av alla PI-resultat:", err.message);
    res.status(500).json({ message: "Kunde inte hämta alla PI-resultat" });
  }
});

/**
 * --------------------
 * 2️⃣ Hämta PI-resultat för specifik användare
 * --------------------
 */
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        pi.id,
        pi.user_id,
        pi.exercise,
        pi.profile,
        pi.result,
        pi.pi,
        pi.created_at,
        up.name,
        up.avatar
      FROM pi_results pi
      LEFT JOIN user_profiles up
        ON pi.user_id::text = up.id::text
      WHERE pi.user_id = $1
      ORDER BY pi.created_at DESC
      `,
      [user_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Fel vid hämtning av PI-resultat:", err.message);
    res.status(500).json({ message: "Kunde inte hämta PI-resultat" });
  }
});

/**
 * --------------------
 * 3️⃣ Spara nytt PI-resultat
 * --------------------
 */
router.post("/", async (req, res) => {
  console.log("📥 POST /pi body:", req.body);

  const { user_id, exercise, profile, result, pi } = req.body;

  if (!user_id || !exercise || !profile || result == null || pi == null) {
    console.log("❌ Ogiltig data");
    return res.status(400).json({ message: "Ogiltig data" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO pi_results (user_id, exercise, profile, result, pi)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, exercise, profile, result, pi]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ Fel vid sparande av PI-resultat:", err.message);
    res.status(500).json({ message: "Kunde inte spara PI-resultat" });
  }
});




export default router;
