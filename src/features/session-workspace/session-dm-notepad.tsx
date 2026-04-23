import { Textarea } from '@/components/ui/textarea'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

interface SessionDmNotepadProps {
  campaignId: string
  sessionId: string
}

export function SessionDmNotepad({ campaignId, sessionId }: SessionDmNotepadProps) {
  const [body, setBody] = useCampaignStorageState<string>(
    campaignId,
    `session-notepad-${sessionId}`,
    '',
  )

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Private scratchpad for this session. Auto-saves as you type.
      </p>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Jot reactions, ad-hoc rules calls, loose ends…"
        rows={16}
        className="font-mono text-sm"
      />
    </div>
  )
}
