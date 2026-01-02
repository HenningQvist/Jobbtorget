import express from "express";
import pool from "../db.js";

const router = express.Router();

// 🗓 Veckonyckel (måndag 00:00)
const weekKey = () => {
  const now = new Date();
  const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
  firstDay.setHours(0, 0, 0, 0);
  return firstDay.toISOString().slice(0, 10);
};

/**
 * ================================
 * GET /competition/week/:userId
 * ================================
 */
router.get("/week/:userId", async (req, res) => {
  const { userId } = req.params;
  const week = weekKey();

  try {
    // 1️⃣ Redan tävling denna vecka?
    const { rows: existing } = await pool.query(
      `
      SELECT *
      FROM weekly_competitions
      WHERE week = $1
        AND (user_a = $2 OR user_b = $2)
      `,
      [week, userId]
    );

    if (existing.length) {
      return res.json(existing[0]);
    }

    // 2️⃣ Upptagna användare
    const { rows: busyUsers } = await pool.query(
      `
      SELECT DISTINCT user_a AS user_id FROM weekly_competitions WHERE week = $1
      UNION
      SELECT DISTINCT user_b FROM weekly_competitions WHERE week = $1
      `,
      [week]
    );

    const busyIds = busyUsers.map(b => b.user_id);

    // 3️⃣ Alla användare med riktiga PI-resultat
    const { rows: allUsers } = await pool.query(
      `
      SELECT DISTINCT user_id
      FROM pi_results
      WHERE user_id != $1
        AND profile != 'BONUS'
        AND exercise != 'competition_bonus'
      `,
      [userId]
    );

    const availablePartners = allUsers
      .map(u => u.user_id)
      .filter(id => !busyIds.includes(id));

    if (!availablePartners.length) {
      return res.status(404).json({
        message: "Ingen ledig partner denna vecka",
      });
    }

    // 4️⃣ Slumpa partner
    const partner =
      availablePartners[
        Math.floor(Math.random() * availablePartners.length)
      ];

    // 5️⃣ Gemensamma övningar där BÅDA har ≤ 100 PI
    const { rows: validExercises } = await pool.query(
      `
      SELECT
        u.exercise,
        SUM(u.pi) AS user_pi,
        SUM(p.pi) AS partner_pi
      FROM pi_results u
      JOIN pi_results p ON u.exercise = p.exercise
      WHERE u.user_id = $1
        AND p.user_id = $2
        AND u.pi > 0
        AND p.pi > 0
        AND u.profile != 'BONUS'
        AND p.profile != 'BONUS'
        AND u.exercise != 'competition_bonus'
      GROUP BY u.exercise
      HAVING
        SUM(u.pi) <= 100
        AND SUM(p.pi) <= 100
      `,
      [userId, partner]
    );

    if (!validExercises.length) {
      return res.status(404).json({
        message: "Ingen gemensam övning där båda ligger under 100 PI",
      });
    }

    // 6️⃣ Slumpa övning
    const exercise =
      validExercises[
        Math.floor(Math.random() * validExercises.length)
      ].exercise;

    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 7️⃣ Skapa tävlingen
    const { rows: inserted } = await pool.query(
      `
      INSERT INTO weekly_competitions
        (week, exercise, user_a, user_b, deadline, locked_until)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [week, exercise, userId, partner, deadline, deadline]
    );

    // 8️⃣ 🔥 REGISTRERA RIVAL (match räknas direkt)
    for (const [a, b] of [
      [userId, partner],
      [partner, userId],
    ]) {
      await pool.query(
        `
        INSERT INTO user_rivals (user_id, rival_id, matches, last_match)
        VALUES ($1, $2, 1, NOW())
        ON CONFLICT (user_id, rival_id)
        DO UPDATE SET
          matches = user_rivals.matches + 1,
          last_match = NOW()
        `,
        [a, b]
      );
    }

    res.json(inserted[0]);

  } catch (err) {
    console.error("❌ Fel vid hämtning av veckotävling:", err.message);
    res.status(500).json({ message: "Kunde inte hämta tävling" });
  }
});

/**
 * ====================================
 * POST /competition/:id/award-bonus
 * ====================================
 */
router.post("/:id/award-bonus", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM weekly_competitions WHERE id = $1`,
      [id]
    );

    const comp = rows[0];
    if (!comp || comp.bonus_awarded) return res.sendStatus(400);

    // 1️⃣ Summera riktig PI
    const { rows: totals } = await pool.query(
      `
      SELECT user_id, SUM(pi) AS total
      FROM pi_results
      WHERE exercise = $1
        AND profile != 'BONUS'
        AND exercise != 'competition_bonus'
        AND user_id::text IN ($2::text, $3::text)
      GROUP BY user_id
      `,
      [comp.exercise, comp.user_a, comp.user_b]
    );

    const userTotal =
      totals.find(r => r.user_id === comp.user_a)?.total || 0;
    const partnerTotal =
      totals.find(r => r.user_id === comp.user_b)?.total || 0;

    const totalPI = Number(userTotal) + Number(partnerTotal);
    if (totalPI < comp.goal) return res.sendStatus(400);

    // 2️⃣ Avgör vinnare
    let winner = null;
    if (userTotal > partnerTotal) winner = comp.user_a;
    else if (partnerTotal > userTotal) winner = comp.user_b;

    // 3️⃣ Ge bonus
    for (const uid of [comp.user_a, comp.user_b]) {
      await pool.query(
        `
        INSERT INTO pi_results
          (user_id, exercise, profile, result, pi, category, created_at)
        VALUES
          ($1, 'competition_bonus', 'BONUS', 0, $2, 'Competition', NOW())
        `,
        [uid, comp.bonus_pi]
      );
    }

    // 4️⃣ Uppdatera rival-statistik
    for (const [a, b] of [
      [comp.user_a, comp.user_b],
      [comp.user_b, comp.user_a],
    ]) {
      await pool.query(
        `
        UPDATE user_rivals
        SET
          wins = wins + CASE WHEN $3 = $1 THEN 1 ELSE 0 END,
          losses = losses + CASE WHEN $3 = $2 THEN 1 ELSE 0 END,
          draws = draws + CASE WHEN $3 IS NULL THEN 1 ELSE 0 END
        WHERE user_id = $1 AND rival_id = $2
        `,
        [a, b, winner]
      );
    }

    // 5️⃣ Lås bonus
    await pool.query(
      `
      UPDATE weekly_competitions
      SET bonus_awarded = true
      WHERE id = $1
      `,
      [id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Fel vid award-bonus:", err.message);
    res.status(500).json({ message: "Kunde inte ge bonus" });
  }
});

export default router;
