import express from "express";
import pool from "../db.js"; // din Postgres-pool

const router = express.Router();

// Hämta alla registreringar med logging (admin)
router.get("/", async (req, res) => {
  try {
    console.log("GET /register - Försöker hämta registreringar...");

    const result = await pool.query(
      "SELECT * FROM registrations ORDER BY created_at ASC"
    );

    console.log("Antal registreringar hämtade:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("Fel vid hämtning av registreringar:", err);
    res.status(500).json({ error: "Något gick fel", details: err.message });
  }
});

// Lägg till en ny registrering med logging
router.post("/", async (req, res) => {
  const { name, phone, activity } = req.body;

  try {
    console.log("POST /register - Data som skickas:", { name, phone, activity });

    const result = await pool.query(
      `INSERT INTO registrations (name, phone, activity) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, phone, activity]
    );

    console.log("Ny registrering tillagd:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid tillägg av registrering:", err);
    res.status(500).json({ error: "Kunde inte spara registreringen", details: err.message });
  }
});

// Ta bort registrering med logging
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log("DELETE /register/:id - Försöker ta bort registrering med id:", id);

    const result = await pool.query(
      "DELETE FROM registrations WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      console.log("Registrering hittades inte:", id);
      return res.status(404).json({ error: "Registrering hittades inte" });
    }

    console.log("Registrering borttagen:", id);
    res.json({ success: true });
  } catch (err) {
    console.error("Fel vid borttagning av registrering:", err);
    res.status(500).json({ error: "Kunde inte ta bort registreringen", details: err.message });
  }
});
// Uppdatera status
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE registrations SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registrering hittades inte" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid uppdatering av status:", err);
    res.status(500).json({ error: "Kunde inte uppdatera status" });
  }
});
// Uppdatera kommentar på registrering
router.put("/:id/comment", async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  try {
    const result = await pool.query(
      "UPDATE registrations SET comment = $1 WHERE id = $2 RETURNING *",
      [comment, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid uppdatering av kommentar:", err);
    res.status(500).json({ error: "Kunde inte uppdatera kommentar", details: err.message });
  }
});


export default router;
