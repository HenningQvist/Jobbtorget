import express from "express";
import pool from "../db.js";

const router = express.Router();

// -------------------- Arbetsplatser --------------------

// Hämta alla arbetsplatser med avdelningar och scheman
router.get("/", async (req, res) => {
  try {
    const workplacesRes = await pool.query("SELECT * FROM workplaces ORDER BY id ASC");
    const workplaces = workplacesRes.rows;

    for (let wp of workplaces) {
      const deptsRes = await pool.query(
        "SELECT * FROM departments WHERE workplace_id = $1 ORDER BY id ASC",
        [wp.id]
      );
      wp.departments = deptsRes.rows;

      for (let dept of wp.departments) {
        const schedulesRes = await pool.query(
          "SELECT * FROM schedules WHERE department_id = $1 ORDER BY id ASC",
          [dept.id]
        );
        dept.schedules = schedulesRes.rows;
      }
    }

    res.json(workplaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte hämta arbetsplatser" });
  }
});

// Skapa arbetsplats med flera avdelningar
router.post("/", async (req, res) => {
  const { name, departments } = req.body;

  if (!name || !departments || !Array.isArray(departments) || departments.length === 0) {
    return res.status(400).json({ error: "Arbetsplatsnamn och minst en avdelning krävs" });
  }

  try {
    // Skapa arbetsplats
    const workplaceResult = await pool.query(
      "INSERT INTO workplaces (name) VALUES ($1) RETURNING *",
      [name]
    );
    const workplace = workplaceResult.rows[0];

    // Skapa alla avdelningar
    for (const dept of departments) {
      await pool.query(
        "INSERT INTO departments (workplace_id, name, capacity) VALUES ($1, $2, $3)",
        [workplace.id, dept.name, dept.capacity || { Arbetsmarknad: 0, SoL: 0 }]
      );
    }

    // Hämta arbetsplats med avdelningar
    const deptsRes = await pool.query(
      "SELECT * FROM departments WHERE workplace_id=$1 ORDER BY id ASC",
      [workplace.id]
    );
    workplace.departments = deptsRes.rows;

    res.json(workplace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte skapa arbetsplats med avdelningar" });
  }
});

// Uppdatera arbetsplats
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      "UPDATE workplaces SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte uppdatera arbetsplats" });
  }
});

// Ta bort arbetsplats
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM workplaces WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ta bort arbetsplats" });
  }
});

// -------------------- Scheman --------------------

// Skapa schema
router.post("/:workplaceId/departments/:departmentId/schedules", async (req, res) => {
  const { departmentId } = req.params;
  const { person, category, selected_days, hours_per_day } = req.body;

  if (!selected_days || !hours_per_day) {
    return res.status(400).json({ error: "selected_days och hours_per_day krävs" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO schedules 
       (department_id, person, category, selected_days, hours_per_day)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [departmentId, person, category, selected_days, hours_per_day]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Fel vid schemaläggning:", err);
    res.status(500).json({ error: "Kunde inte lägga till schema" });
  }
});

// Uppdatera schema
router.put("/:workplaceId/departments/:departmentId/schedules/:scheduleId", async (req, res) => {
  const { scheduleId } = req.params;
  const { person, category, selected_days, hours_per_day } = req.body;

  try {
    const result = await pool.query(
      `UPDATE schedules SET person=$1, category=$2, selected_days=$3, hours_per_day=$4 
       WHERE id=$5 RETURNING *`,
      [person, category, selected_days, hours_per_day, scheduleId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte uppdatera schema" });
  }
});

// Ta bort schema
router.delete("/:workplaceId/departments/:departmentId/schedules/:scheduleId", async (req, res) => {
  const { scheduleId } = req.params;
  try {
    await pool.query("DELETE FROM schedules WHERE id=$1", [scheduleId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ta bort schema" });
  }
});

export default router;
