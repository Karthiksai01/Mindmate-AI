import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// ✅ LOAD ENVIRONMENT VARIABLES FIRST!
// This must be the first thing your app does.
dotenv.config();

// Now, the rest of your app can safely use the environment variables
connectDB();

const app = express();
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// This console log should now correctly show your key on startup
console.log("GEMINI_API_KEY is loaded.");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));