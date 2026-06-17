import { GoogleGenerativeAI } from "@google/generative-ai";
import { JAVA_TO_DSL_PROMPT } from "./prompt.ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

async function convertWithOllama(javaCode) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen2.5-coder:7b ",
      prompt: `${JAVA_TO_DSL_PROMPT}\n\n${javaCode}`,
      stream: false,
      options: {
        temperature: 0,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Ollama request failed");
  }

  const data = await response.json();

  return {
    dsl: data.response.trim(),
    provider: "ollama"
  };
}

async function convertWithGemini(javaCode) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const result = await model.generateContent(
    `${JAVA_TO_DSL_PROMPT}\n\n${javaCode}`
  );

  return {
    dsl: result.response.text().trim(),
    provider: "gemini"
  };
}

export async function convertJavaToDSL(
  javaCode,
  provider = "auto"
) {
  try {
    // AUTO => Try Ollama first
    if (provider === "auto" || provider === "ollama") {
      return await convertWithOllama(javaCode);
    }

    return await convertWithGemini(javaCode);
  } catch (err) {
    console.warn(
      "Ollama failed. Falling back to Gemini.",
      err
    );

    return await convertWithGemini(javaCode);
  }
}