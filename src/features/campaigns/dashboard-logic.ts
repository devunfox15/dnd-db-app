import type { AppState, Campaign } from '@/features/core/types'

export interface CampaignDashboardItem {
  campaign: Campaign
  lastUpdatedAt: string
  excerpt: string
}

function maxIsoDate(values: string[]): string {
  return values.reduce((latest, value) => (value > latest ? value : latest), values[0] ?? new Date(0).toISOString())
}

export function getCampaignLastUpdatedAt(campaignId: string, state: AppState): string {
  const values = [
    ...state.campaigns.filter((item) => item.id === campaignId).map((item) => item.updatedAt),
    ...state.notes.filter((item) => item.campaignId === campaignId).map((item) => item.updatedAt),
    ...state.pins.filter((item) => item.campaignId === campaignId).map((item) => item.updatedAt),
    ...state.maps.filter((item) => item.campaignId === campaignId).map((item) => item.updatedAt),
    ...state.npcs.filter((item) => item.campaignId === campaignId).map((item) => item.updatedAt),
    ...state.timelineEvents.filter((item) => item.campaignId === campaignId).map((item) => item.updatedAt),
    ...state.lookupEntries.filter((item) => item.campaignId === campaignId).map((item) => item.updatedAt),
  ]

  return maxIsoDate(values)
}

export function getCampaignExcerpt(campaign: Campaign, state: AppState): string {
  const latestEvent = [...state.timelineEvents]
    .filter((event) => event.campaignId === campaign.id && event.details.trim())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

  if (latestEvent?.details.trim()) {
    return latestEvent.details.trim()
  }

  const latestPin = [...state.pins]
    .filter((pin) => pin.campaignId === campaign.id && pin.summary.trim())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

  if (latestPin?.summary.trim()) {
    return latestPin.summary.trim()
  }

  if (campaign.description.trim()) {
    return campaign.description.trim()
  }

  return 'No story progress yet.'
}

export function getCampaignDashboardItems(state: AppState): CampaignDashboardItem[] {
  return [...state.campaigns]
    .map((campaign) => ({
      campaign,
      lastUpdatedAt: getCampaignLastUpdatedAt(campaign.id, state),
      excerpt: getCampaignExcerpt(campaign, state),
    }))
    .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt))
}
