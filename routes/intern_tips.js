// src/routes/internTips.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// Hämta alla interna platstips
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM intern_tips ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fel vid hämtning av platstips:", err);
    res.status(500).json({ error: "Kunde inte hämta platstips" });
  }
});

// Skapa ett nytt platstips
router.post("/", async (req, res) => {
  const { title, description, status, created_by } = req.body; 
  try {
    const result = await pool.query(
      `INSERT INTO intern_tips (title, description, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [title, description, status || "ledig", created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid skapande av platstips:", err);
    res.status(500).json({ error: "Kunde inte skapa platstips" });
  }
});

// Uppdatera status (t.ex. "pågående", "studiebesök", "klar")
router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE intern_tips SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tips hittades inte" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid uppdatering av status:", err);
    res.status(500).json({ error: "Kunde inte uppdatera status" });
  }
});

// Ta bort ett tips
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM intern_tips WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tips hittades inte" });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error("Fel vid borttagning av platstips:", err);
    res.status(500).json({ error: "Kunde inte ta bort platstips" });
  }
});

export default router;
