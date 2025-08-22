// server.js eller routes/jobs.js
import express from "express";
import pool from "./db.js"; // PostgreSQL-anslutning

const router = express.Router();

// Hämta alla jobb
router.get("/jobs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM jobs ORDER BY end_date ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Något gick fel" });
  }
});

// Lägg till ett nytt jobb
router.post("/jobs", async (req, res) => {
  const { title, link, description, category, end_date } = req.body; // ✅ ändrat här
  try {
    const result = await pool.query(
      "INSERT INTO jobs (title, link, description, category, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, link, description, category, end_date] // ✅ samma namn
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte spara jobbet" });
  }
});


// Ta bort jobb
router.delete("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM jobs WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ta bort jobbet" });
  }
});

export default router;
