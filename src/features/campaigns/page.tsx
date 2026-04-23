import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FolderOpen, Trash2, CheckCircle2, Plus, Scroll } from 'lucide-react'

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { getCampaignDashboardItems } from '@/features/campaigns/dashboard-logic'
import { mvpRpgOptions, rpgLabel } from '@/features/campaigns/rpg-options'
import { appRepository, useAppState } from '@/features/core/store'
import type { CampaignRpgSystem, Campaign } from '@/features/core/types'

function getNextCampaignNumericId(campaigns: Campaign[]): string {
  const maxNumericId = campaigns.reduce((maxValue, campaign) => {
    const nextValue = /^\d+$/.test(campaign.id)
      ? Number(campaign.id)
      : Number.NaN
    return Number.isFinite(nextValue) && nextValue > maxValue
      ? nextValue
      : maxValue
  }, 0)

  return String(maxNumericId + 1)
}

export default function FeaturePage() {
  const state = useAppState()
  const [title, setTitle] = useState('')
  const [rpgSystem, setRpgSystem] = useState<CampaignRpgSystem>('dnd-5e')
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingDeleteCampaignId, setPendingDeleteCampaignId] = useState<
    string | null
  >(null)

  const dashboardItems = useMemo(
    () => getCampaignDashboardItems(state),
    [state],
  )

  const handleCreateCampaign = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const id = getNextCampaignNumericId(state.campaigns)
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
    setCreateOpen(false)
  }

  const handleOpenCampaign = (campaignId: string) => {
    appRepository.setActiveCampaign(campaignId)
  }

  const handleConfirmDelete = () => {
    if (!pendingDeleteCampaignId) return
    appRepository.deleteCampaignCascade(pendingDeleteCampaignId)
    setPendingDeleteCampaignId(null)
  }

  return (
    <div className="h-full space-y-4">
      {/* Nav bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Campaigns</span>
          <span className="rounded-md border bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {dashboardItems.length}
          </span>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaign grid */}
      <div className="h-full">
        {dashboardItems.length === 0 ? (
          <div className="h-full">
            <Empty className="h-full border py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Scroll />
                </EmptyMedia>
                <EmptyTitle>No campaigns yet</EmptyTitle>
                <EmptyDescription>
                  Create your first campaign to start planning sessions,
                  managing NPCs, and building your world.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="size-4" />
                  Create new campaign
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          dashboardItems.map((item) => {
            const isActive = state.activeCampaignId === item.campaign.id

            return (
              <div
                key={item.campaign.id}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                <div
                  className={`group flex flex-col rounded-lg border bg-card p-4 transition-shadow duration-150 hover:shadow-sm ${
                    isActive ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-snug">
                        {item.campaign.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {rpgLabel(item.campaign.rpgSystem)}
                      </p>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    )}
                  </div>

                  {/* Excerpt */}
                  <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {item.excerpt || 'No notes yet.'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground/50">
                      {new Date(item.lastUpdatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 cursor-pointer text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setPendingDeleteCampaignId(item.campaign.id)
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                      <Link
                        to="/campaigns/$campaignId"
                        params={{ campaignId: item.campaign.id }}
                        onClick={() => handleOpenCampaign(item.campaign.id)}
                      >
                        <Button size="sm" className="gap-1.5">
                          <FolderOpen className="size-3.5" />
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="campaign-title">
                Title
              </label>
              <Input
                id="campaign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Curse of Strahd"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCampaign()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                htmlFor="campaign-rpg-system"
              >
                RPG System
              </label>
              <select
                id="campaign-rpg-system"
                value={rpgSystem}
                onChange={(e) =>
                  setRpgSystem(e.target.value as CampaignRpgSystem)
                }
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {mvpRpgOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateCampaign}
                disabled={!title.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(pendingDeleteCampaignId)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteCampaignId(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action removes the campaign and all related notes, story
              pins, maps, NPCs, timeline events, and lookup entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
