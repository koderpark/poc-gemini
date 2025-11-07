import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { env } from "hono/adapter";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import page from "./page/translator.js";
import { parseDocument } from "./app/translate.js";

dotenv.config();
const app = new Hono();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI,
});

const prompt = fs.readFileSync("prompt.txt", "utf8");

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/translate", page);

app.post("/query", async (c) => {
  const { body } = await c.req.parseBody();
  const response = await ai.models.generateContent({
    config: {
      systemInstruction: prompt,
    },
    model: "gemini-2.5-flash",
    contents: [body as string],
  });
  return c.json({ response: response.text });
});

app.post("/parse", async (c) => {
  const { body } = await c.req.parseBody();
  const response = await parseDocument(body as string);
  return c.json(response);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);