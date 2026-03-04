import { useCallback, useEffect, useRef, useState } from 'react'
import type { GroupImperativeHandle } from 'react-resizable-panels'

import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { CampaignChatPanel } from '@/features/campaign-chat/components/campaign-chat-panel'
import type { CampaignChatSection } from '@/features/campaign-chat/types'

interface CampaignSectionWithChatProps {
  section: CampaignChatSection
  children: React.ReactNode
}

const CHAT_DEFAULT_PX = 320
const CHAT_MAX_PX = 400
const CONTENT_MIN_PX = 320

export function CampaignSectionWithChat({
  section,
  children,
}: CampaignSectionWithChatProps) {
  const groupRef = useRef<GroupImperativeHandle | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isAdjustingRef = useRef(false)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)

  const contentPanelId = `${section}-content-panel`
  const chatPanelId = `${section}-chat-panel`

  const setLayoutFromChatWidth = useCallback(
    (desiredChatPx: number) => {
      const containerWidth = containerRef.current?.clientWidth ?? 0
      if (containerWidth <= 0) {
        return
      }

      const maxChatBySpace = Math.max(0, containerWidth - CONTENT_MIN_PX)
      const clampedChatPx = Math.max(
        0,
        Math.min(desiredChatPx, CHAT_MAX_PX, maxChatBySpace),
      )
      const chatPercent = (clampedChatPx / containerWidth) * 100
      const contentPercent = 100 - chatPercent

      isAdjustingRef.current = true
      groupRef.current?.setLayout({
        [contentPanelId]: contentPercent,
        [chatPanelId]: chatPercent,
      })
      queueMicrotask(() => {
        isAdjustingRef.current = false
      })
    },
    [chatPanelId, contentPanelId],
  )

  const expandChat = () => {
    setLayoutFromChatWidth(CHAT_DEFAULT_PX)
  }

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }

    const observer = new ResizeObserver(() => {
      const layout = groupRef.current?.getLayout()
      const chatPercent = layout?.[chatPanelId] ?? 0
      const containerWidth = element.clientWidth
      const currentChatPx = (chatPercent / 100) * containerWidth

      if (currentChatPx > CHAT_MAX_PX) {
        setLayoutFromChatWidth(CHAT_MAX_PX)
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [chatPanelId, setLayoutFromChatWidth])

  return (
    <>
      <div ref={containerRef} className="relative hidden min-h-0 lg:block">
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-[72vh] rounded border"
          groupRef={groupRef}
          onLayoutChange={(layout) => {
            const chatPercent = layout[chatPanelId] ?? 0
            setIsChatCollapsed(chatPercent <= 1)

            if (isAdjustingRef.current) {
              return
            }

            const containerWidth = containerRef.current?.clientWidth ?? 0
            if (containerWidth <= 0) {
              return
            }

            const chatPx = (chatPercent / 100) * containerWidth
            if (chatPx > CHAT_MAX_PX) {
              setLayoutFromChatWidth(CHAT_MAX_PX)
            }
          }}
        >
          <ResizablePanel id={contentPanelId} defaultSize={72} minSize={20}>
            <div className="h-full overflow-auto p-3">{children}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            id={chatPanelId}
            defaultSize={28}
            minSize={200}
            maxSize={400}
            collapsible
            collapsedSize={0}
          >
            <div className="h-full p-3">
              <CampaignChatPanel
                section={section}
                className="h-full min-h-80"
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {isChatCollapsed ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="absolute top-4 right-4 z-20"
            onClick={expandChat}
          >
            Show Chat
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
        <div>{children}</div>
        <CampaignChatPanel section={section} className="w-100 min-h-80" />
      </div>
    </>
  )
}
