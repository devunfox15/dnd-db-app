export interface EncounterEnemy {
  id: string
  name: string
  hp: number
  initiative: number
  status?: string
}

export interface EncounterTemplate {
  id: string
  campaignId: string
  name: string
  terrain: string
  notes: string
  enemies: EncounterEnemy[]
  createdAt: string
  updatedAt: string
}

export interface EncounterLibraryState {
  byCampaign: Record<string, EncounterTemplate[]>
}
