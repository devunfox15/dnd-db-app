import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { CampaignChatPanel } from '@/features/campaign-chat/components/campaign-chat-panel'
import type { CampaignChatSection } from '@/features/campaign-chat/types'

interface CampaignSectionWithChatProps {
  section: CampaignChatSection
  children: React.ReactNode
}

export function CampaignSectionWithChat({ section, children }: CampaignSectionWithChatProps) {
  return (
    <>
      <div className="hidden min-h-0 lg:block">
        <ResizablePanelGroup direction="horizontal" className="min-h-[72vh] rounded border">
          <ResizablePanel defaultSize={72} minSize={55}>
            <div className="h-full overflow-auto p-3">{children}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={28} minSize={20} maxSize={45}>
            <div className="h-full p-3">
              <CampaignChatPanel section={section} className="h-full min-h-[320px]" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
        <div>{children}</div>
        <CampaignChatPanel section={section} className="min-h-[320px]" />
      </div>
    </>
  )
}
