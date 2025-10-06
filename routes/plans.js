// routes/plans.js
import express from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// -----------------------------
// 📝 Skapa ny plan
// -----------------------------
router.post("/", async (req, res) => {
  const { meta, goals, activities, gamification, participantId } = req.body;
  console.log("📥 POST /plans body:", JSON.stringify(req.body, null, 2));

  if (!participantId) {
    return res.status(400).json({ error: "ParticipantId saknas" });
  }

  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO plans (id, participant_id, data) VALUES ($1, $2, $3)`,
      [id, participantId, JSON.stringify({ meta, goals, activities, gamification })]
    );

    console.log("✅ Plan sparad med id:", id);
    res.status(201).json({ id, message: "Plan skapad" });
  } catch (err) {
    console.error("❌ POST /plans fel:", err);
    res.status(500).json({ error: "Kunde inte skapa plan" });
  }
});

// -----------------------------
// 📄 Hämta alla planer (optionellt per deltagare)
// -----------------------------
router.get("/", async (req, res) => {
  const { participantId } = req.query;
  try {
    let query = "SELECT * FROM plans";
    const params = [];

    if (participantId) {
      query += " WHERE participant_id = $1";
      params.push(participantId);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    console.log(`📤 GET /plans result: ${result.rows.length} planer för participantId ${participantId || "alla"}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /plans fel:", err);
    res.status(500).json({ error: "Kunde inte hämta planer" });
  }
});

// -----------------------------
// 📄 Hämta en plan via id
// -----------------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM plans WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      console.log("⚠️ GET /plans/:id - ingen plan hittad för id:", id);
      return res.status(404).json({ error: "Plan ej hittad" });
    }

    console.log("📤 GET /plans/:id - hittad plan:", id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ GET /plans/:id fel:", err);
    res.status(500).json({ error: "Kunde inte hämta plan" });
  }
});

// -----------------------------
// ✏️ Uppdatera plan
// -----------------------------
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { meta, goals, activities, gamification } = req.body;
  console.log("📥 PUT /plans/:id body:", id, JSON.stringify(req.body, null, 2));

  try {
    await pool.query(
      `UPDATE plans SET data = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify({ meta, goals, activities, gamification }), id]
    );

    console.log("✅ Plan uppdaterad:", id);
    res.json({ message: "Plan uppdaterad" });
  } catch (err) {
    console.error("❌ PUT /plans/:id fel:", err);
    res.status(500).json({ error: "Kunde inte uppdatera plan" });
  }
});

// -----------------------------
// 🗑️ Ta bort plan
// -----------------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ DELETE /plans/:id - försökta ta bort plan:", id);

  try {
    await pool.query("DELETE FROM plans WHERE id = $1", [id]);
    console.log("✅ Plan borttagen:", id);
    res.json({ message: "Plan borttagen" });
  } catch (err) {
    console.error("❌ DELETE /plans/:id fel:", err);
    res.status(500).json({ error: "Kunde inte ta bort plan" });
  }
});

export default router;
