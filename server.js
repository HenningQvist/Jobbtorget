import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import jobsRouter from "./routes/jobs.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// API routes
app.use("/jobs", jobsRouter);

app.listen(port, () => {
  console.log(`✅ Servern kör på http://localhost:${port}`);
});
