import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  createAssistantErrorMessage,
  createAssistantMessage,
  createUserMessage,
  findUserMessageById,
  removeRetryErrors,
} from '@/features/campaign-chat/chat-logic'
import { buildCampaignSectionSystemPrompt } from '@/features/campaign-chat/prompt-builder'
import { sectionLabel } from '@/features/campaign-chat/section-focus'
import { sendCampaignChat } from '@/features/campaign-chat/server/send-campaign-chat'
import { clearSectionMessages, getSectionMessages, saveSectionMessages } from '@/features/campaign-chat/store'
import type { CampaignChatSection, ChatMessage, SendCampaignChatInput, SendCampaignChatResult } from '@/features/campaign-chat/types'
import { useAppState } from '@/features/core/store'

interface CampaignChatPanelProps {
  section: CampaignChatSection
  className?: string
  sendMessage?: (input: SendCampaignChatInput) => Promise<SendCampaignChatResult>
}

export function CampaignChatPanel({ section, className, sendMessage = (input) => sendCampaignChat({ data: input }) }: CampaignChatPanelProps) {
  const appState = useAppState()
  const [messages, setMessages] = useState<ChatMessage[]>(() => getSectionMessages(section))
  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const systemPrompt = useMemo(
    () => buildCampaignSectionSystemPrompt({ section, state: appState }),
    [appState, section]
  )

  useEffect(() => {
    setMessages(getSectionMessages(section))
  }, [section])

  const persistMessages = (nextMessages: ChatMessage[]) => {
    const saved = saveSectionMessages(section, nextMessages)
    setMessages(saved)
    return saved
  }

  const submitUserPrompt = async (content: string, retrySourceUserMessageId?: string) => {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    const userMessage = createUserMessage(trimmed, retrySourceUserMessageId)

    const isRetry = Boolean(retrySourceUserMessageId)
    const baseMessages = isRetry
      ? removeRetryErrors(messages, retrySourceUserMessageId as string)
      : messages

    const nextWithUser = isRetry
      ? baseMessages
      : [...baseMessages, userMessage]

    const persistedWithUser = persistMessages(nextWithUser)

    try {
      const response = await sendMessage({
        section,
        messages: persistedWithUser,
        systemPrompt,
      })

      const assistantMessage = createAssistantMessage(response.reply)

      persistMessages([...persistedWithUser, assistantMessage])
      setDraft('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to get a response from assistant.'
      const failedMessageId = retrySourceUserMessageId ?? userMessage.id

      const errorMessage = createAssistantErrorMessage(message, failedMessageId)

      persistMessages([...persistedWithUser, errorMessage])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSend = async () => {
    await submitUserPrompt(draft)
  }

  const handleRetry = async (userMessageId: string) => {
    const original = findUserMessageById(messages, userMessageId)
    if (!original) {
      return
    }

    await submitUserPrompt(original.content, original.id)
  }

  const handleClear = () => {
    clearSectionMessages(section)
    setMessages([])
    setDraft('')
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle>{sectionLabel(section)} Assistant</CardTitle>
        <p className="text-xs text-muted-foreground">Focused planning help for this campaign section.</p>
      </CardHeader>
      <CardContent className="flex h-full min-h-0 flex-col gap-3">
        <div className="max-h-[52vh] min-h-[220px] space-y-2 overflow-y-auto rounded border p-2" aria-live="polite">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ask for ideas, refinements, or next-step planning help.</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`rounded border px-2 py-1 text-xs ${message.role === 'user' ? 'bg-muted/30' : 'bg-background'} ${
                  message.isError ? 'border-destructive/60' : ''
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium uppercase tracking-wide text-[10px]">
                    {message.role === 'user' ? 'You' : message.isError ? 'Assistant Error' : 'Assistant'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {message.isError && message.retrySourceUserMessageId ? (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => handleRetry(message.retrySourceUserMessageId as string)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask for plot points, pacing ideas, or section-specific suggestions..."
          rows={4}
        />

        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={handleClear} disabled={messages.length === 0 || isSubmitting}>
            Clear Chat
          </Button>
          <Button type="button" onClick={handleSend} disabled={isSubmitting || !draft.trim()}>
            {isSubmitting ? 'Thinking...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
