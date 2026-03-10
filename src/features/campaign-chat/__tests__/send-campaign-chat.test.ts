import { describe, expect, it, vi } from 'vitest'

import { buildOllamaChatUrl, mapChatError, requestOllamaChat } from '@/features/campaign-chat/server/send-campaign-chat'
import type { SendCampaignChatInput } from '@/features/campaign-chat/types'

const input: SendCampaignChatInput = {
  section: 'npc-characters',
  systemPrompt: 'system prompt',
  messages: [
    {
      id: 'user-1',
      role: 'user',
      content: 'help me build a villain',
      createdAt: new Date().toISOString(),
    },
  ],
}

describe('send campaign chat server helpers', () => {
  it('builds Ollama chat URL from base URL', () => {
    expect(buildOllamaChatUrl('http://127.0.0.1:11434/')).toBe('http://127.0.0.1:11434/api/chat')
  })

  it('sends expected model and endpoint payload', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message: {
            content: 'Use a rival guild with a personal grudge.',
          },
        }),
        { status: 200 }
      )
    )

    const result = await requestOllamaChat(input, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'http://127.0.0.1:11434',
      timeoutMs: 5_000,
    })

    expect(result.reply).toContain('rival guild')
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://127.0.0.1:11434/api/chat')
    const body = JSON.parse(String(init.body))
    expect(body.model).toBe('qwen3-coder-next:latest')
    expect(body.stream).toBe(false)
    expect(body.messages[0].role).toBe('system')
  })

  it('maps timeout/network errors to user-safe text', () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    expect(mapChatError(abortError)).toContain('timed out')
    expect(mapChatError(new Error('fetch failed'))).toContain('Could not connect')
  })

  it('throws on non-2xx responses', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 500 }))

    await expect(
      requestOllamaChat(input, {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        baseUrl: 'http://127.0.0.1:11434',
      })
    ).rejects.toThrow('status 500')
  })
})
