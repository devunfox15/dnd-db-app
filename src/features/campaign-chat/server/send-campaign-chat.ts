import { createServerFn } from '@tanstack/react-start'

import type { ChatMessage, SendCampaignChatInput, SendCampaignChatResult } from '@/features/campaign-chat/types'

const DEFAULT_OLLAMA_MODEL = 'qwen3-coder-next'
const REQUEST_TIMEOUT_MS = 120_000

function stripThinkingTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

interface OllamaChatResponse {
  message?: {
    content?: string
  }
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

export function buildOllamaChatUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/api/chat`
}

export function toOllamaMessages(systemPrompt: string, messages: ChatMessage[]) {
  const cleaned = messages
    .filter((message) => message.role === 'user' || (message.role === 'assistant' && !message.isError))
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

  return [{ role: 'system', content: systemPrompt }, ...cleaned]
}

export function mapChatError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'Ollama request timed out. Make sure your local model is running, then retry.'
    }

    if (/fetch failed|ECONNREFUSED|ENOTFOUND/i.test(error.message)) {
      return 'Could not connect to local Ollama. Confirm it is running and reachable from OLLAMA_BASE_URL.'
    }

    return error.message
  }

  return 'Failed to contact Ollama. Please retry.'
}

export async function requestOllamaChat(
  input: SendCampaignChatInput,
  options?: {
    fetchImpl?: typeof fetch
    timeoutMs?: number
    baseUrl?: string
    model?: string
  }
): Promise<SendCampaignChatResult> {
  // `LLAMA_API_KEY` is kept as a fallback for older local setups.
  const baseUrl = options?.baseUrl ?? process.env.OLLAMA_BASE_URL ?? process.env.LLAMA_API_KEY
  const model = options?.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL

  if (!baseUrl) {
    throw new Error('OLLAMA_BASE_URL is not set. Expected a local Ollama base URL like http://127.0.0.1:11434')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs ?? REQUEST_TIMEOUT_MS)
  const fetchImpl = options?.fetchImpl ?? fetch

  try {
    const response = await fetchImpl(buildOllamaChatUrl(baseUrl), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: false,
        options: { think: false },
        messages: toOllamaMessages(input.systemPrompt, input.messages),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`)
    }

    const payload = (await response.json()) as OllamaChatResponse
    const reply = stripThinkingTags(payload.message?.content ?? '')

    if (!reply) {
      throw new Error('Ollama returned an empty response.')
    }

    return { reply }
  } finally {
    clearTimeout(timeoutId)
  }
}

export const sendCampaignChat = createServerFn({ method: 'POST' })
  .inputValidator((input: SendCampaignChatInput) => input)
  .handler(async ({ data }) => {
    try {
      return await requestOllamaChat(data)
    } catch (error) {
      throw new Error(mapChatError(error))
    }
  })
