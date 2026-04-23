import { Link } from '@tanstack/react-router'
import { BookOpenIcon, NotebookPenIcon, PlayCircleIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { rpgLabel } from '@/features/campaigns/rpg-options'
import { useAppState } from '@/features/core/store'
import { DataPortabilityCard } from '@/features/home/components/data-portability-card'

export function DashboardSummary() {
  const state = useAppState()
  const activeCampaign =
    state.campaigns.find(
      (campaign) => campaign.id === state.activeCampaignId,
    ) ?? null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">
              Session Hub
            </Badge>
            <CardTitle className="text-2xl">Ready to play</CardTitle>
            <CardDescription>
              Start each session here, then jump directly into rules or campaign
              planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Link to="/rpgs">
              <Button className="w-full justify-start gap-2" size="lg">
                <BookOpenIcon className="size-4" />
                Open RPG Library
              </Button>
            </Link>
            <Link to="/campaigns">
              <Button
                className="w-full justify-start gap-2"
                size="lg"
                variant="secondary"
              >
                <NotebookPenIcon className="size-4" />
                Open Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeCampaign ? (
              <>
                <div>
                  <p className="text-base font-semibold">
                    {activeCampaign.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rpgLabel(activeCampaign.rpgSystem)}
                  </p>
                </div>
                <Link
                  to="/campaigns/$campaignId"
                  params={{ campaignId: activeCampaign.id }}
                >
                  <Button className="gap-2">
                    <PlayCircleIcon className="size-4" />
                    Resume Campaign
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active campaign selected yet. Create one from the Campaigns
                page.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Campaigns Created</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {state.campaigns.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total NPC Count</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {state.npcs.length}
          </CardContent>
        </Card>
      </div>

      <DataPortabilityCard />
    </div>
  )
}
