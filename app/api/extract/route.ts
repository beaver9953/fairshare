// app/api/extract/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), timeoutMs)
    ),
  ]);
}

// Safely parses JSON from AI responses, stripping markdown if necessary
function safeJsonParse(text: string) {
  try {
    // First attempt: standard parse
    return JSON.parse(text);
  } catch (e) {
    // Second attempt: strip markdown code blocks and try again
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const promptText = `You are an AI financial assistant for FairShare. 
Extract the total amount, a descriptive category (e.g., Electricity, Water, Internet, Rent, Household Goods), 
and a short description from the provided bill document. 
Return ONLY a JSON object with exactly these keys: "category", "description", "totalCost".
Ensure "totalCost" is a number. Do not include any markdown formatting or extra text.`;

    // --- PRIMARY ENGINE: Google AI Studio ---
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log(`[AI] Primary (Gemini) initiating...`);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const match = imageBase64.match(/^data:(.+);base64,(.*)$/);
        const mimeType = match ? match[1] : "image/jpeg";
        const base64Data = match ? match[2] : imageBase64;

        const geminiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: promptText },
                { inlineData: { mimeType, data: base64Data } },
              ],
            },
          ],
          config: { responseMimeType: "application/json" },
        });

        const response = await withTimeout(geminiPromise, 8000);

        if (response.text) {
          console.log(`[AI] Primary (Gemini) extraction successful.`);
          return NextResponse.json({
            success: true,
            data: safeJsonParse(response.text),
          });
        }
      } catch (err: any) {
        console.warn(`[AI] Primary (Gemini) failed/fast-timeout: ${err.message}`);
        console.warn(`[AI] Instantly falling back to OpenRouter...`);
      }
    }

    // --- FALLBACK ENGINE: OpenRouter ---
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log(`[AI] Fallback (OpenRouter) initiating...`);
        const openrouter = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: process.env.OPENROUTER_API_KEY,
        });

        const fallbackModels = process.env.OPENROUTER_MODELS 
          ? process.env.OPENROUTER_MODELS.split(",").map((m) => m.trim())
          : ["google/gemini-3.8-flash"];

        const openRouterPromise = openrouter.chat.completions.create({
          models: fallbackModels,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: imageBase64 } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 500, // Increased from 150 to ensure JSON completes
        });

        const response = await withTimeout(openRouterPromise, 10000);

        const responseText = response.choices[0]?.message?.content;
        if (responseText) {
          console.log(`[AI] Fallback (OpenRouter) extraction successful.`);
          return NextResponse.json({
            success: true,
            data: safeJsonParse(responseText),
          });
        }
      } catch (err: any) {
        console.error(`[AI] Fallback (OpenRouter) failed: ${err.message}`);
      }
    }

    throw new Error("All AI engines failed or timed out.");

  } catch (error: any) {
    console.error("[AI Extraction Critical Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}