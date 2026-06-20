import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/clue", async (req, res) => {
    try {
      const { gameState } = req.body;
      
      const prompt = `
        You are a mystical island cartographer. Give a short, cryptic, and atmospheric clue about where the relics might be.
        The island is a 12x12 grid. The player is at (${gameState.playerPos.x}, ${gameState.playerPos.y}).
        Relics are at these coordinates: ${gameState.tiles.filter((t: any) => t.entity === 'relic' && !t.entityFound).map((t: any) => `(${t.x}, ${t.y})`).join(', ')}.
        Mention the terrain types (e.g., forest, mountain, desert).
        Keep it under 30 words. Do not give direct coordinates, use directions or landmarks.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 1,
          topP: 0.95,
        }
      });

      res.json({ clue: response.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "The spirits are silent today..." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
