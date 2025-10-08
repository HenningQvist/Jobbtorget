// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import documentsRouter from "./routes/documents.js";
import workplacesRouter from "./routes/workplaces.js";
import activityRoutes from "./routes/activities.js";
import coursesRouter from "./routes/courses.js";
import visitsRouter from "./routes/visits.js";
import internTipsRouter from "./routes/internTipsRouter.js";
import registrationRouter from "./routes/registrationRouter.js";
import authRegisterRouter from "./routes/authRegisterRouter.js";
import plansRouter from "./routes/plans.js";  
import jobsRouter from "./routes/jobs.js"; 
import authRouter from "./routes/auth.js";  
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------- Middleware --------------------
const allowedOrigins = [
  "http://localhost:3000",
  "https://digitala-jobbtorget.netlify.app"   // ✅ Netlify-produktionsdomän
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blockerad CORS-origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------- Startlogg --------------------
console.log("🚀 Startar backend...");
console.log("🌍 Miljö:", process.env.NODE_ENV || "development");
console.log("📦 Port:", PORT);

if (process.env.DATABASE_URL) {
  console.log("🔗 Använder Railway DATABASE_URL");
} else {
  console.log("🔗 Använder lokala PostgreSQL-inställningar:", {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
  });
}

// -------------------- Test endpoints --------------------
app.get("/ping", (req, res) => res.json({ message: "✅ Servern svarar!" }));

app.get("/dbtest", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "✅ DB-anslutning OK", time: result.rows[0].now });
  } catch (error) {
    console.error("❌ DB-test misslyckades:", error.message);
    res.status(500).json({ error: "Kunde inte ansluta till databasen" });
  }
});

// -------------------- Routrar --------------------
app.use("/jobs", jobsRouter);
app.use("/documents", documentsRouter);
app.use("/workplaces", workplacesRouter);
app.use("/activities", activityRoutes);
app.use("/register", registrationRouter);
app.use("/intern-tips", internTipsRouter);
app.use("/auth", authRouter);  
app.use("/auth/register", authRegisterRouter);
app.use("/plans", plansRouter); 
app.use("/courses", coursesRouter); 
app.use("/visits", visitsRouter);

// -------------------- Start server --------------------
app.listen(PORT, () => {
  console.log(`✅ Servern kör på port ${PORT}`);
});
