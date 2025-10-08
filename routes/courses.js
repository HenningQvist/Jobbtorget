// routes/courses.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📥 Hämta alla utbildningar
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY application_start ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Något gick fel vid hämtning av utbildningar" });
  }
});

// 💾 Lägg till en ny utbildning
router.post("/", async (req, res) => {
  const { name, description, application_start, application_end, course_start, info_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO courses (name, description, application_start, application_end, course_start, info_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, application_start, application_end, course_start, info_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte spara utbildningen" });
  }
});

// ❌ Ta bort utbildning
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM courses WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ta bort utbildningen" });
  }
});

export default router;
