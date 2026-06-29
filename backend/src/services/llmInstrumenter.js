import OpenAI from "openai";
import { buildInstrumentationPrompt } from "./instrumentationPrompt.js";
import { detectStructures } from "./structureDetector.js";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/**
 * Sends the user's plain Java code to the LLM and gets back the same
 * program with Trace.* calls inserted.
 *
 * IMPORTANT: this function's only job is CODE REWRITING, not simulation.
 * The returned source still needs to be compiled and actually run by
 * compileAndRun.js — nothing here is "the trace" yet.
 *
 * The prompt is built FRESH per request, containing only the sections
 * relevant to what's detected in the user's code (see structureDetector.js
 * and instrumentationPrompt.js for why — long always-everything prompts
 * cause smaller open-source models to lose track of specific rules).
 */
export async function instrumentJavaCode(javaCode, { feedback = null } = {}) {
  const flags = detectStructures(javaCode);
  const systemPrompt = buildInstrumentationPrompt(flags);

  console.log("[llmInstrumenter] Detected structures:", JSON.stringify(flags));
  console.log("[llmInstrumenter] Prompt length:", systemPrompt.length, "chars");

  let userMessage = `Here is the Java program to instrument:\n\n${javaCode}`;

  if (feedback) {
    userMessage += `\n\nNOTE: a previous attempt failed with this error — fix it while following all the same rules:\n${feedback}`;
  }

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    max_tokens: 4000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("LLM returned no instrumented code");
  }

  const code = extractJavaSource(text);

  console.log(
    "[llmInstrumenter] Raw model output length:",
    text.length,
    "| Cleaned code length:",
    code.length
  );

  return code;
}

/**
 * Robustly pulls Java source out of the model's raw response, whether it's
 * plain code, fenced with ```java ... ```, or fenced with plain ``` ... ```.
 * Open-source models served via Groq sometimes add fences despite being told
 * not to — this handles that without needing a strict anchored regex.
 */
function extractJavaSource(rawText) {
  const text = rawText.trim();

  const fenceMatch = text.match(/```(?:java)?\s*\n([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1].trim()) {
    return fenceMatch[1].trim();
  }

  return text.replace(/^```(?:java)?\n?/i, "").replace(/```$/i, "").trim();
}