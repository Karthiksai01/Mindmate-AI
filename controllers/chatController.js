import Chat from "../models/Chat.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// A helper function to generate a title for a new chat
const generateChatTitle = async (model, firstMessage) => {
  try {
    const prompt = `Summarize the following user prompt into a concise title of 5 words or less. Do not use quotes or any introductory phrases like "Title:". Just provide the title itself. Prompt: "${firstMessage}"`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating title:", error);
    // Fallback to the old method if title generation fails
    return firstMessage.slice(0, 30);
  }
};

export const newMessage = async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let { chatId, message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let chat;
    const isNewChat = !chatId;

    if (isNewChat) {
      // For a new chat, we don't create it until we have the first message and title
      chat = new Chat({ userId, messages: [] });
    } else {
      chat = await Chat.findById(chatId);
      if (!chat) return res.status(404).json({ error: "Chat not found" });
      // Security check: Ensure the user owns this chat
      if (chat.userId.toString() !== userId) {
        return res.status(403).json({ error: "Unauthorized access to chat" });
      }
    }

    // Add user message to the chat object
    chat.messages.push({ role: "user", content: message });
    
    // --- Generate AI Reply ---
    const history = chat.messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user', // Map 'assistant' to 'model' for the API
      parts: [{ text: m.content }]
    }));
    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(message);
    const aiReply = result.response.text();
    chat.messages.push({ role: "assistant", content: aiReply });
    
    // If it's a new chat, generate a title now
    if (isNewChat) {
      chat.title = await generateChatTitle(model, message);
    }

    await chat.save();

    // For a new chat, we need to send back the new chat's ID and Title
    if (isNewChat) {
        res.status(201).json({ 
            reply: aiReply, 
            newChat: {
                _id: chat._id,
                title: chat.title
            }
        });
    } else {
        res.status(200).json({ reply: aiReply });
    }

  } catch (err) {
    console.error("Gemini AI error:", err);
    res.status(500).json({ error: "Failed to generate a response from the AI." });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
                            .select("title createdAt")
                            .sort({ createdAt: -1 }); // Show newest first
    res.json(chats);
  } catch (err) {
    console.error("getUserChats error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  } catch (err) {
    console.error("getChatById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

