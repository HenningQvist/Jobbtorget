import express from "express";
import pool from "../db.js";

const router = express.Router();

/* =============================
   📌 Hämta alla aktiviteter
============================= */
router.get("/", async (req, res) => {
  try {
    console.log("GET /activities - Försöker hämta aktiviteter...");

    const result = await pool.query(
      "SELECT * FROM activities ORDER BY created_at ASC"
    );

    console.log("Antal aktiviteter hämtade:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("Fel vid hämtning av aktiviteter:", err);
    res.status(500).json({ error: "Något gick fel", details: err.message });
  }
});

/* =============================
   ➕ Lägg till ny aktivitet
============================= */
router.post("/", async (req, res) => {
  const {
    title,
    description,
    category,
    target_group,
    effort_level,
    language_requirement,   // 🆕 nytt fält
    language_focus,         // 🆕 nytt fält
    group_ability,
    sobriety_requirement,
    physical_demand,
  } = req.body;

  try {
    console.log("POST /activities - Data som skickas:", {
      title,
      description,
      category,
      target_group,
      effort_level,
      language_requirement,
      language_focus,
      group_ability,
      sobriety_requirement,
      physical_demand,
    });

    const result = await pool.query(
      `INSERT INTO activities 
      (title, description, category, target_group, effort_level, language_requirement, language_focus, group_ability, sobriety_requirement, physical_demand) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        title,
        description,
        category,
        target_group,
        effort_level,
        language_requirement,
        language_focus,
        group_ability,
        sobriety_requirement,
        physical_demand,
      ]
    );

    console.log("✅ Ny aktivitet tillagd:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid tillägg av aktivitet:", err);
    res.status(500).json({ error: "Kunde inte spara aktiviteten", details: err.message });
  }
});

/* =============================
   🗑️ Ta bort aktivitet
============================= */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log("DELETE /activities/:id - Försöker ta bort aktivitet med id:", id);

    await pool.query("DELETE FROM activities WHERE id = $1", [id]);

    console.log("🗑️ Aktivitet borttagen:", id);
    res.json({ success: true });
  } catch (err) {
    console.error("Fel vid borttagning av aktivitet:", err);
    res.status(500).json({ error: "Kunde inte ta bort aktiviteten", details: err.message });
  }
});

export default router;
