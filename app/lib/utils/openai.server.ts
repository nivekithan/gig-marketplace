import OpenAI from "openai";
import { env } from "./env.server";

export async function getEmbedding(content: string) {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const openaiRes = await openai.embeddings.create({
    input: content,
    model: "text-embedding-ada-002",
  });

  const embedding = openaiRes.data[0].embedding;

  return embedding;
}
