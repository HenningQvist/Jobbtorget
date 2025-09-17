import express from "express";
import pool from "../db.js";

const router = express.Router();

// 🔹 Hämta alla tips
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM intern_tips ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fel vid hämtning:", err.message);
    res.status(500).json({ error: "Kunde inte hämta tips" });
  }
});

// 🔹 Lägg till tips
router.post("/", async (req, res) => {
  const { title, description, expiresAt, createdBy, responsible, status } =
    req.body;
  try {
    const result = await pool.query(
      `INSERT INTO intern_tips (title, description, expires_at, created_by, responsible, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, expiresAt, createdBy, responsible, status || "Tillgänglig"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid sparande:", err.message);
    res.status(400).json({ error: "Kunde inte spara tips" });
  }
});

// 🔹 Uppdatera status (servicefilen använder PUT /:id/status)
router.put("/:id/status", async (req, res) => {
  const { status, responsible } = req.body;
  try {
    const result = await pool.query(
      `UPDATE intern_tips
       SET status = COALESCE($1, status),
           responsible = COALESCE($2, responsible)
       WHERE id = $3
       RETURNING *`,
      [status, responsible, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Tips ej hittat" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid uppdatering:", err.message);
    res.status(400).json({ error: "Kunde inte uppdatera tips" });
  }
});

// 🔹 Ta bort tips
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM intern_tips WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Tips ej hittat" });
    res.json({ success: true });
  } catch (err) {
    console.error("Fel vid borttagning:", err.message);
    res.status(400).json({ error: "Kunde inte ta bort tips" });
  }
});

export default router;
