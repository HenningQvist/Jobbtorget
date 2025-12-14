import express from "express";
import pool from "../db.js";

const router = express.Router();

/* 📥 Hämta alla tester för en användare */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM strength_tests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    res.status(500).json({ error: "Kunde inte hämta tester" });
  }
});

/* 💾 Spara nytt test */
router.post("/", async (req, res) => {
  console.log("📥 Incoming strength test:", req.body);

  const { user_id, test_key, value, score } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO strength_tests (user_id, test_key, value, score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, test_key, value, score]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Insert error:", err.message);
    res.status(500).json({ error: "Kunde inte spara test" });
  }
});

export default router;
