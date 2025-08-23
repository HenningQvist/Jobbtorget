import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import jobsRouter from "./routes/jobs.js"; // Korrekt väg från server.js till routes/jobs.js

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Alla requests till /jobs går till jobsRouter
app.use("/jobs", jobsRouter);

app.listen(PORT, () => {
  console.log(`✅ Servern kör på port ${PORT}`);
});
