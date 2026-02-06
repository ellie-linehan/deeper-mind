import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("Gemini API Key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiModel = (modelName: string = "gemini-pro") => {
  return genAI.getGenerativeModel({ model: modelName });
};
