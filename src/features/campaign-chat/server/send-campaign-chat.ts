import { createServerFn } from '@tanstack/react-start'

import type { ChatMessage, SendCampaignChatInput, SendCampaignChatResult } from '@/features/campaign-chat/types'

const OLLAMA_MODEL = 'qwen3-coder-next'
const REQUEST_TIMEOUT_MS = 30_000

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
      return 'Could not connect to local Ollama. Confirm it is running and reachable from LLAMA_API_KEY.'
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
  }
): Promise<SendCampaignChatResult> {
  // Historical env name retained by request. It stores the local Ollama base URL.
  const baseUrl = options?.baseUrl ?? process.env.LLAMA_API_KEY

  if (!baseUrl) {
    throw new Error('LLAMA_API_KEY is not set. Expected a local Ollama base URL like http://127.0.0.1:11434')
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
        model: OLLAMA_MODEL,
        stream: false,
        messages: toOllamaMessages(input.systemPrompt, input.messages),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`)
    }

    const payload = (await response.json()) as OllamaChatResponse
    const reply = payload.message?.content?.trim()

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
