import { convertJavaToDSL } from "./api";

export async function compileCode(javaCode) {
  const result = await convertJavaToDSL(javaCode);

  if (!result?.dsl) {
    throw new Error("Failed to generate DSL");
  }

  

  return result.dsl.trim();
}