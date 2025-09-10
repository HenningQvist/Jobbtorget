import express from "express";
import pool from "../db.js";

const router = express.Router();

// Hämta scheman för en arbetsplats
router.get("/:workplaceId", async (req, res) => {
  const { workplaceId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM schedules WHERE workplace_id = $1",
      [workplaceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fel vid hämtning av scheman:", err);
    res.status(500).json({ error: "Kunde inte hämta scheman" });
  }
});

// Skapa schema
router.post("/", async (req, res) => {
  const { workplaceId, person, category, hoursPerDay, selectedDays } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO schedules (workplace_id, person, category, hours_per_day, selected_days) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [workplaceId, person, category, hoursPerDay, selectedDays]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid skapande av schema:", err);
    res.status(500).json({ error: "Kunde inte skapa schema" });
  }
});

// Ta bort schema
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM schedules WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Fel vid radering av schema:", err);
    res.status(500).json({ error: "Kunde inte ta bort schema" });
  }
});

export default router;
