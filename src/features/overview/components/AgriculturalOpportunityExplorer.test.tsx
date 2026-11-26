// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AgriculturalOpportunityExplorer } from './AgriculturalOpportunityExplorer'

describe('AgriculturalOpportunityExplorer', () => {
  afterEach(cleanup)
  it('reveals one responsive row of opportunity cards per click', () => {
    cleanup()
    window.innerWidth = 390
    render(
      <AgriculturalOpportunityExplorer
        crop="maize"
        season="A"
        year="2024-25"
        onOpenDistrictProfile={() => undefined}
        onOpenEvidence={() => undefined}
      />,
    )
    const groups = [
      screen.getByRole('heading', { name: /Below national reference/ }).closest('section'),
      screen.getByRole('heading', { name: /At or above national reference/ }).closest('section'),
    ].filter((group): group is HTMLElement => Boolean(group))
    const counts = () =>
      groups.map((group) => within(group).queryAllByRole('article').length)

    const initial = counts()
    expect(initial.every((count) => count <= 1)).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }))
    const expanded = counts()
    expect(expanded.every((count, index) => count - (initial[index] ?? 0) <= 1)).toBe(true)
    expect(expanded.some((count, index) => count > (initial[index] ?? 0))).toBe(true)
  })

  it('navigates to the district profile and both source evidence records', () => {
    const onOpenDistrictProfile = vi.fn()
    const onOpenEvidence = vi.fn()

    render(
      <AgriculturalOpportunityExplorer
        crop="maize"
        season="A"
        year="2024-25"
        selectedDistrict="Gasabo"
        onOpenDistrictProfile={onOpenDistrictProfile}
        onOpenEvidence={onOpenEvidence}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Agricultural Opportunity Explorer' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Observed district yield'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Observed national reference'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Calculated difference · district minus national'),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Open profile for Gasabo/i }),
    )
    expect(onOpenDistrictProfile).toHaveBeenCalledWith('Gasabo')

    fireEvent.click(
      screen.getByRole('button', { name: /Review opportunity evidence for Gasabo/i }),
    )
    expect(onOpenEvidence).toHaveBeenCalledWith(
      'Gasabo',
      [
        'sas-2025-season-a-gasabo-average_yield',
        'sas-2025-season-a-rwanda-average_yield',
      ],
    )
  })
})
