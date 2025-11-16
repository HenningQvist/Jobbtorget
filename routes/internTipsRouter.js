// routes/internTipsRoutes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// 🔹 Hämta alla tips
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM intern_tips ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fel vid hämtning:", err.message);
    res.status(500).json({ error: "Kunde inte hämta tips" });
  }
});

// 🔹 Lägg till nytt tips
router.post("/", async (req, res) => {
  const {
    title,
    description,
    expiresAt,
    createdBy,
    responsible,
    status,
    assignedType,
    candidates,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO intern_tips 
       (title, description, expires_at, created_by, responsible, status, assigned_type, candidates)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description,
        expiresAt,
        createdBy,
        responsible,
        status || "Tillgänglig",
        assignedType || "direct",
        JSON.stringify(candidates || []),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid sparande:", err.message);
    res.status(400).json({ error: "Kunde inte spara tips" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const result = await pool.query(
      `UPDATE intern_tips
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           expires_at = COALESCE($3, expires_at),
           created_by = COALESCE($4, created_by),
           responsible = COALESCE($5, responsible),
           status = COALESCE($6, status),
           assigned_type = COALESCE($7, assigned_type),
           candidates = COALESCE($8, candidates)
       WHERE id = $9
       RETURNING *`,
      [
        updates.title,
        updates.description,
        updates.expires_at,
        updates.created_by,
        updates.responsible,
        updates.status,
        updates.assigned_type,
        JSON.stringify(updates.candidates || []),
        id,
      ]
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
