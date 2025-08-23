// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jobsRouter from "./routes/jobs.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// API routes
app.use("/jobs", jobsRouter);

app.get("/", (req, res) => {
  res.send("🚀 Backend är igång!");
});

app.listen(PORT, () => {
  console.log(`✅ Servern kör på port ${PORT}`);
});
