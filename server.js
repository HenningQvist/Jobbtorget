import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import documentsRouter from "./routes/documents.js";
import workplacesRouter from "./routes/workplaces.js";
import activityRoutes from "./routes/activities.js";
import internTipsRouter from "./routes/internTipsRouter.js";
import registrationRouter from "./routes/registrationRouter.js";
import jobsRouter from "./routes/jobs.js"; 
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // För HTML-formulär

// -------------------- Startlogg --------------------
console.log("🚀 Startar backend...");
console.log("🌍 Miljö:", process.env.NODE_ENV || "development");
console.log("📦 Port:", PORT);

if (process.env.DATABASE_URL) {
  console.log("🔗 Använder Railway DATABASE_URL");
} else {
  console.log("🔗 Använder lokala PostgreSQL-inställningar:");
  console.log({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
  });
}

// -------------------- Test endpoints --------------------
app.get("/ping", (req, res) => {
  console.log("📡 /ping anrop mottaget");
  res.json({ message: "✅ Servern svarar!" });
});

app.get("/dbtest", async (req, res) => {
  console.log("📡 /dbtest anrop mottaget");
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ DB-anslutning lyckades:", result.rows[0].now);
    res.json({ message: "✅ DB-anslutning OK", time: result.rows[0].now });
  } catch (error) {
    console.error("❌ DB-test misslyckades:", error.message);
    res.status(500).json({ error: "Kunde inte ansluta till databasen" });
  }
});

// -------------------- Routrar --------------------
app.use("/jobs", jobsRouter);
app.use("/documents", documentsRouter);
app.use("/workplaces", workplacesRouter); // inkluderar avdelningar och scheman
app.use("/activities", activityRoutes);
app.use("/register", registrationRouter);
app.use("/intern-tips", internTipsRouter);

// -------------------- Start server --------------------
app.listen(PORT, () => {
  console.log(`✅ Servern kör på port ${PORT}`);
});
