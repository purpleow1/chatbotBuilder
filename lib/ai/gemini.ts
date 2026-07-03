import "server-only";
import { ApiError } from "@/lib/api/errors";

export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
export const GEMINI_EMBEDDING_DIMENSIONS = 768;
export const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-3.1-flash-lite";

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[];
  };
  embeddings?: Array<{
    values?: number[];
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    message?: string;
    status?: string;
  };
};

export type GeminiChatResult = {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
  model: string;
  finishReason: string | null;
};

function parseJsonResponse<T>(text: string): T | null {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function truncateForLog(value: string, maxLength = 4000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}... [truncated]` : value;
}

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new ApiError(503, "GEMINI_API_KEY is required to ingest and search knowledge sources.", "gemini_not_configured");
  }

  return apiKey;
}

function getEmbeddingText(text: string, usage: "document" | "query", title?: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (usage === "document") {
    return `title: ${title?.trim() || "none"} | text: ${normalized}`;
  }

  return `task: question answering | query: ${normalized}`;
}

function parseEmbedding(response: GeminiEmbeddingResponse) {
  const values = response.embedding?.values ?? response.embeddings?.[0]?.values;

  if (!values || values.length === 0) {
    throw new ApiError(502, "Gemini returned an empty embedding.", "empty_embedding");
  }

  if (values.length !== GEMINI_EMBEDDING_DIMENSIONS) {
    throw new ApiError(
      502,
      `Gemini returned ${values.length} dimensions, but the database expects ${GEMINI_EMBEDDING_DIMENSIONS}.`,
      "embedding_dimension_mismatch"
    );
  }

  return values;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function toPgVector(values: number[]) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

export async function generateGeminiEmbedding(text: string, usage: "document" | "query", title?: string) {
  const apiKey = getGeminiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;
  const body = {
    content: {
      parts: [
        {
          text: getEmbeddingText(text, usage, title)
        }
      ]
    },
    output_dimensionality: GEMINI_EMBEDDING_DIMENSIONS
  };
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(body)
      });
      const responseText = await response.text();
      const payload = parseJsonResponse<GeminiEmbeddingResponse>(responseText);

      if (!response.ok) {
        const message = payload?.error?.message ?? `Gemini embedding request failed with status ${response.status}.`;
        const details = {
          model: GEMINI_EMBEDDING_MODEL,
          usage,
          attempt: attempt + 1,
          status: response.status,
          statusText: response.statusText,
          response: payload ?? truncateForLog(responseText)
        };

        console.error("Gemini embedding request failed.", details);

        if ((response.status === 429 || response.status >= 500) && attempt < 2) {
          await sleep(400 * 2 ** attempt);
          continue;
        }

        throw new ApiError(
          response.status >= 500 ? 502 : response.status,
          `Gemini embedding request failed: ${message}`,
          "gemini_embedding_failed",
          details
        );
      }

      if (!payload) {
        throw new ApiError(502, "Gemini returned a non-JSON embedding response.", "gemini_invalid_json", {
          model: GEMINI_EMBEDDING_MODEL,
          usage,
          attempt: attempt + 1,
          status: response.status,
          statusText: response.statusText,
          responseText: truncateForLog(responseText)
        });
      }

      return parseEmbedding(payload);
    } catch (error) {
      lastError = error;

      if (error instanceof ApiError || attempt === 2) {
        console.error("Gemini embedding attempt failed.", {
          model: GEMINI_EMBEDDING_MODEL,
          usage,
          attempt: attempt + 1,
          error
        });
        throw error;
      }

      console.error("Gemini embedding attempt failed; retrying.", {
        model: GEMINI_EMBEDDING_MODEL,
        usage,
        attempt: attempt + 1,
        error
      });
      await sleep(400 * 2 ** attempt);
    }
  }

  throw lastError;
}

export async function generateGeminiChatResponse(prompt: string): Promise<GeminiChatResult> {
  const apiKey = getGeminiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CHAT_MODEL}:generateContent`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 900
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ]
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body)
    });
    const responseText = await response.text();
    const payload = parseJsonResponse<GeminiGenerateContentResponse>(responseText);

    if (!response.ok) {
      const message = payload?.error?.message ?? `Gemini chat request failed with status ${response.status}.`;
      const details = {
        model: GEMINI_CHAT_MODEL,
        attempt: attempt + 1,
        status: response.status,
        statusText: response.statusText,
        response: payload ?? truncateForLog(responseText)
      };

      console.error("Gemini chat request failed.", details);

      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await sleep(400 * 2 ** attempt);
        continue;
      }

      throw new ApiError(
        response.status >= 500 ? 502 : response.status,
        `Gemini chat request failed: ${message}`,
        "gemini_chat_failed",
        details
      );
    }

    if (!payload) {
      throw new ApiError(502, "Gemini returned a non-JSON chat response.", "gemini_invalid_json", {
        model: GEMINI_CHAT_MODEL,
        attempt: attempt + 1,
        status: response.status,
        statusText: response.statusText,
        responseText: truncateForLog(responseText)
      });
    }

    const candidate = payload.candidates?.[0];
    const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";

    if (!text) {
      throw new ApiError(502, "Gemini returned an empty chat response.", "empty_chat_response");
    }

    return {
      text,
      inputTokens: payload.usageMetadata?.promptTokenCount ?? null,
      outputTokens: payload.usageMetadata?.candidatesTokenCount ?? null,
      model: GEMINI_CHAT_MODEL,
      finishReason: candidate?.finishReason ?? null
    };
  }

  throw new ApiError(502, "Gemini chat request failed after retries.", "gemini_chat_failed");
}
