import express from "express";
import { newMessage, getUserChats, getChatById } from "../controllers/chatController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/message", authMiddleware, newMessage);
router.get("/", authMiddleware, getUserChats);
router.get("/:id", authMiddleware, getChatById);

export default router;
