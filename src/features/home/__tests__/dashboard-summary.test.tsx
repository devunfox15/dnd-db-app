import { describe, expect, it } from 'vitest'

import { DashboardSummary } from '@/features/home/components/dashboard-summary'
import { DataPortabilityCard } from '@/features/home/components/data-portability-card'

describe('DashboardSummary module', () => {
  it('exports the DashboardSummary component', () => {
    expect(DashboardSummary).toBeTypeOf('function')
  })

  it('exports the DataPortabilityCard component', () => {
    expect(DataPortabilityCard).toBeTypeOf('function')
  })
})
