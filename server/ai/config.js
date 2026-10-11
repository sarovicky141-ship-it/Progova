import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "GEMINI_API_KEY is not configured. Gemini-powered chatbot features will fail until it is set."
  );
}

export const ai = new GoogleGenAI({
  apiKey,
});