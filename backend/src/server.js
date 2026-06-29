import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import javaToDslRouter from "./routes/javaToDsl.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api", javaToDslRouter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`AlgoViz backend listening on http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn(
      "WARNING: GROQ_API_KEY is not set. Copy .env.example to .env and add your key."
    );
  }
});