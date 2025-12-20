import express from "express";
import pool from "../db.js"; // PostgreSQL-anslutning

const router = express.Router();

// -------------------- Hämta genomförda pass för en användare --------------------
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM training_sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Gruppér per pass (workout_name)
    const sessions = {};
    result.rows.forEach((row) => {
      if (!sessions[row.workout_name]) sessions[row.workout_name] = [];
      sessions[row.workout_name].push({
        exercise_name: row.exercise_name,
        set_number: row.set_number,
        reps: row.reps,
        weight: row.weight,
        created_at: row.created_at,
        pi: row.pi || 0, // inkludera PI i response
      });
    });

    res.json(sessions);
  } catch (err) {
    console.error("❌ Kunde inte hämta träningspass:", err);
    res.status(500).json({ error: "Kunde inte hämta träningspass" });
  }
});

// -------------------- Hämta passmallar för en användare --------------------
router.get("/templates/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log(`📥 Hämtar passmallar för userId: ${userId}`);

  try {
    const result = await pool.query(
      `SELECT * FROM training_templates 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    console.log("📊 SQL-resultat rader:", result.rows);

    const templates = {};
    result.rows.forEach((row) => {
      if (!templates[row.workout_name]) templates[row.workout_name] = [];
      templates[row.workout_name].push({ exercise_name: row.exercise_name });
    });

    console.log("✅ Formaterade templates:", templates);

    res.json(templates);
  } catch (err) {
    console.error("❌ Kunde inte hämta passmallar:", err);
    res.status(500).json({ error: "Kunde inte hämta passmallar" });
  }
});

// -------------------- Spara genomfört pass --------------------
router.post("/", async (req, res) => {
  const { userId, workoutName, exercises, pi = 10 } = req.body; // PI default 10

  if (!userId || !workoutName || !Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: "Saknade obligatoriska fält" });
  }

  try {
    const queries = exercises.map((ex) => {
      const { exercise_name, set_number, reps, weight, created_at } = ex;
      return pool.query(
        `INSERT INTO training_sessions 
         (user_id, workout_name, exercise_name, set_number, reps, weight, created_at, pi)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          userId,
          workoutName,
          exercise_name,
          set_number,
          reps,
          weight,
          created_at || new Date().toISOString(),
          pi, // spara PI
        ]
      );
    });

    const results = await Promise.all(queries);
    const saved = results.map((r) => r.rows[0]);
    res.json(saved);
  } catch (err) {
    console.error("❌ Kunde inte spara träningspass:", err);
    res.status(500).json({ error: "Kunde inte spara träningspass" });
  }
});

// -------------------- Spara passmall --------------------
router.post("/templates", async (req, res) => {
  const { userId, workoutName, exercises } = req.body;

  if (!userId || !workoutName || !Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({ error: "Saknade obligatoriska fält" });
  }

  try {
    const queries = exercises.map((ex) => {
      return pool.query(
        `INSERT INTO training_templates 
         (user_id, workout_name, exercise_name, created_at)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [userId, workoutName, ex, new Date().toISOString()]
      );
    });

    const results = await Promise.all(queries);
    const saved = results.map((r) => r.rows[0]);
    res.json(saved);
  } catch (err) {
    console.error("❌ Kunde inte spara passmallen:", err);
    res.status(500).json({ error: "Kunde inte spara passmallen" });
  }
});

export default router;
