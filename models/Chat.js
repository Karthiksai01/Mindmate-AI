import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, default: "New Chat" },
  messages: [
    {
      role: { type: String, enum: ["user", "assistant"] },
      content: String
    }
  ]
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);
