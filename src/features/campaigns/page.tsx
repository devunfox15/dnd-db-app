import { useMemo, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getCampaignDashboardItems } from '@/features/campaigns/dashboard-logic'
import { rpgLabel, rpgOptions } from '@/features/campaigns/rpg-options'
import { appRepository, useAppState } from '@/features/core/store'
import type { CampaignRpgSystem } from '@/features/core/types'

function createCampaignId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `campaign-${crypto.randomUUID()}`
  }

  return `campaign-${Math.random().toString(36).slice(2, 10)}`
}

export default function FeaturePage() {
  const state = useAppState()
  const [title, setTitle] = useState('')
  const [rpgSystem, setRpgSystem] = useState<CampaignRpgSystem>('dnd-5e')
  const [pendingDeleteCampaignId, setPendingDeleteCampaignId] = useState<string | null>(null)

  const dashboardItems = useMemo(() => getCampaignDashboardItems(state), [state])

  const handleCreateCampaign = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return
    }

    const id = createCampaignId()
    const created = appRepository.create('campaigns', {
      id,
      campaignId: id,
      name: trimmedTitle,
      description: '',
      rpgSystem,
      tags: [],
    })

    appRepository.setActiveCampaign(created.id)
    setTitle('')
    setRpgSystem('dnd-5e')
  }

  const handleOpenCampaign = (campaignId: string) => {
    appRepository.setActiveCampaign(campaignId)
  }

  const handleConfirmDelete = () => {
    if (!pendingDeleteCampaignId) {
      return
    }

    appRepository.deleteCampaignCascade(pendingDeleteCampaignId)
    setPendingDeleteCampaignId(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Campaign</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="campaign-title">
              Title
            </label>
            <Input
              id="campaign-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Campaign title"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="campaign-rpg-system">
              RPG System
            </label>
            <select
              id="campaign-rpg-system"
              value={rpgSystem}
              onChange={(event) => setRpgSystem(event.target.value as CampaignRpgSystem)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              {rpgOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleCreateCampaign} disabled={!title.trim()}>
            Create
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4">
        {dashboardItems.length === 0 ? (
          <Card className="w-full">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No campaigns yet. Create your first campaign to begin planning.
            </CardContent>
          </Card>
        ) : (
          dashboardItems.map((item) => {
            const isActive = state.activeCampaignId === item.campaign.id

            return (
              <Card
                key={item.campaign.id}
                className={`w-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.67rem)] xl:basis-[calc(25%-0.75rem)] ${
                  isActive ? 'ring-1 ring-primary' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-2 text-base">{item.campaign.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{rpgLabel(item.campaign.rpgSystem)}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-4 text-sm text-muted-foreground">{item.excerpt}</p>

                  <p className="text-[11px] text-muted-foreground">
                    Updated {new Date(item.lastUpdatedAt).toLocaleString()}
                  </p>

                  <div className="flex items-center gap-2">
                    <a href="/campaigns/npc-characters" onClick={() => handleOpenCampaign(item.campaign.id)}>
                      <Button size="sm">Open</Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPendingDeleteCampaignId(item.campaign.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteCampaignId)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteCampaignId(null)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action removes the campaign and all related notes, story pins, maps, NPCs, timeline events, and
              lookup entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
