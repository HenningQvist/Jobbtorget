import express from "express";
import pool from "../db.js";

const router = express.Router();

// Hämta alla arbetsplatser
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM workplaces ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fel vid hämtning av arbetsplatser:", err);
    res.status(500).json({ error: "Kunde inte hämta arbetsplatser" });
  }
});

// Skapa en ny arbetsplats
router.post("/", async (req, res) => {
  const { name, capacity } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO workplaces (name, capacity) VALUES ($1, $2) RETURNING *",
      [name, capacity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid skapande av arbetsplats:", err);
    res.status(500).json({ error: "Kunde inte skapa arbetsplats" });
  }
});

export default router;
