// routes/activities.js
import express from "express";
import pool from "../db.js"; // PostgreSQL-anslutning

const router = express.Router();

// Hämta alla aktiviteter
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM activities ORDER BY created_at ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Något gick fel" });
  }
});

// Lägg till en ny aktivitet
router.post("/", async (req, res) => {
  const { title, description, category } = req.body; // ta bort language
  try {
    const result = await pool.query(
      "INSERT INTO activities (title, description, category) VALUES ($1, $2, $3) RETURNING *",
      [title, description, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte spara aktiviteten" });
  }
});


// Ta bort aktivitet
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM activities WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ta bort aktiviteten" });
  }
});

export default router;
