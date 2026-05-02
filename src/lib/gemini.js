import { GoogleGenAI } from "@google/genai";

const KEY = process.env.GEMINI_API_KEY;

let _ai;
export function ai() {
  if (!_ai) {
    if (!KEY) throw new Error("GEMINI_API_KEY not set");
    _ai = new GoogleGenAI({ apiKey: KEY });
  }
  return _ai;
}

export const FAST_MODEL = process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash";
export const REASON_MODEL = process.env.GEMINI_MODEL_REASON || "gemini-2.5-pro";

export async function generateJson({ model, system, prompt, schema, temperature = 0.2 }) {
  const res = await ai().models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature,
    },
  });
  const text = res.text ?? res.response?.text ?? "";
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Gemini did not return valid JSON: ${text?.slice(0, 200)}`);
  }
}
