import "server-only"

import Anthropic, { AnthropicError, APIConnectionTimeoutError, APIError } from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"

import { classifyUserText, CLASSIFY_SYSTEM_PROMPT } from "./prompt"
import {
  checkClassification,
  classificationSchema,
  type Classification,
  type FallbackReason,
  type LanguageFlag,
} from "./schema"

// One model call for all photos of a report (Tech.md §7, FR-6). No temperature, top_p, top_k,
// thinking, prefill or tools: they either return 400 or tie the code to one model, and the
// model comes from ANTHROPIC_MODEL so ticket 20 can switch it without a code change.

export const MODEL_TIMEOUT_MS = 12_000
export const MODEL_MAX_TOKENS = 2048 // thinking spends max_tokens too; not the size of the JSON

// what goes into agent_runs (no name, email or image; DB.md §4.5)
export type ModelRun = {
  model: string
  durationMs: number
  stopReason: string | null
  inputTokens: number | null
  outputTokens: number | null
}

export type ClassifyOutcome =
  | {
      ok: true
      result: Classification
      languageFlags: LanguageFlag[]
      removedContactData: number
      run: ModelRun
    }
  | { ok: false; reason: FallbackReason; errorCode: string; run: ModelRun }

// zodOutputFormat throws when the output does not match the schema; this keeps the response
// (stop_reason, usage) and turns such output into parsed_output === null instead.
const zodFormat = zodOutputFormat(classificationSchema)
const outputFormat = {
  ...zodFormat,
  parse: (content: string): Classification | null => {
    try {
      return zodFormat.parse(content)
    } catch {
      return null
    }
  },
}

export function createModelClient(apiKey: string) {
  return new Anthropic({ apiKey, timeout: MODEL_TIMEOUT_MS, maxRetries: 0 })
}

// images: base64 JPEGs, 1024 px on the longer side, in photo order (position 1..n)
export function buildClassifyRequest(images: string[], model: string) {
  return {
    model,
    max_tokens: MODEL_MAX_TOKENS,
    system: CLASSIFY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user" as const,
        // images before the text (Tech.md §7)
        content: [
          ...images.map((data) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
          })),
          { type: "text" as const, text: classifyUserText(images.length) },
        ],
      },
    ],
    output_config: { effort: "low" as const, format: outputFormat },
  }
}

export async function classifyPhotos(
  images: string[],
  options: { apiKey: string | undefined; model: string },
): Promise<ClassifyOutcome> {
  const started = Date.now()
  const run = (extra: Partial<ModelRun> = {}): ModelRun => ({
    model: options.model,
    durationMs: Date.now() - started,
    stopReason: null,
    inputTokens: null,
    outputTokens: null,
    ...extra,
  })

  if (!options.apiKey) {
    return { ok: false, reason: "no_api_key", errorCode: "no_api_key", run: run() }
  }

  try {
    const client = createModelClient(options.apiKey)
    const message = await client.messages.parse(buildClassifyRequest(images, options.model))
    const done = run({
      stopReason: message.stop_reason,
      inputTokens: message.usage?.input_tokens ?? null,
      outputTokens: message.usage?.output_tokens ?? null,
    })

    // stop_reason before reading (Tech.md §7); Haiku 5.5 has no server-side refusal fallback
    if (message.stop_reason === "refusal") {
      return { ok: false, reason: "refusal", errorCode: "refusal", run: done }
    }
    if (message.stop_reason === "max_tokens") {
      return { ok: false, reason: "max_tokens", errorCode: "max_tokens", run: done }
    }
    if (message.parsed_output == null) {
      return { ok: false, reason: "invalid_output", errorCode: "invalid_output", run: done }
    }

    const checked = checkClassification(message.parsed_output, images.length)
    return { ok: true, ...checked, run: done }
  } catch (error) {
    if (error instanceof APIConnectionTimeoutError) {
      return { ok: false, reason: "timeout", errorCode: "timeout", run: run() }
    }
    if (error instanceof APIError) {
      const code = error.status ? `api_${error.status}` : "api_connection"
      return { ok: false, reason: "api_error", errorCode: code, run: run() }
    }
    if (error instanceof AnthropicError) {
      return { ok: false, reason: "invalid_output", errorCode: "invalid_output", run: run() }
    }
    return { ok: false, reason: "api_error", errorCode: "unknown", run: run() }
  }
}
