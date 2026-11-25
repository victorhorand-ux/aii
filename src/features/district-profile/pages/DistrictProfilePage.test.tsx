// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import { getDistrictYieldHistory } from '../../overview/utils/districtYieldHistory'
import { DistrictProfilePage } from './DistrictProfilePage'

const navigationProps = {
  onOpenEvidence: vi.fn(),
  onNavigateOverview: vi.fn(),
  onNavigateMethodology: vi.fn(),
  onOpenInvestigationBrief: vi.fn(),
}

afterEach(cleanup)

describe('DistrictProfilePage productivity history', () => {
  it('shows only observed source records used by the selected district trend', () => {
    const { rerender } = render(
      <DistrictProfilePage
        {...navigationProps}
        crop="maize"
        season="season-a"
        selectedDistrict="Nyarugenge"
        year="2024-25"
      />,
    )

    const expected = getDistrictYieldHistory(
      evidenceRecords,
      'Nyarugenge',
      'Maize',
      'A',
      '2024/25',
    )
    expect(expected.status).toBe('available')
    if (expected.status !== 'available') return

    const history = screen.getByRole('list', {
      name: 'Observed district yield by agricultural year',
    })
    const rows = within(history).getAllByRole('listitem')
    expect(rows).toHaveLength(expected.records.length)
    expected.records.forEach((record, index) => {
      expect(rows[index]).toHaveTextContent(record.period.year)
      expect(rows[index]).toHaveTextContent(
        `${record.value?.toLocaleString('en-RW', { maximumFractionDigits: 1 })} ${record.unit}`,
      )
      expect(rows[index]).toHaveTextContent('Observed source record')
    })
    expect(screen.getByText(/Derived net change/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /View trend evidence/ }),
    ).toBeInTheDocument()

    const firstDisclosure = within(rows[0]).getByText(/Observed source record/)
    firstDisclosure.closest('details')?.querySelector('summary')?.click()
    expect(
      within(rows[0]).getByText(expected.records[0].id),
    ).toBeInTheDocument()

    rerender(
      <DistrictProfilePage
        {...navigationProps}
        crop="maize"
        season="season-a"
        selectedDistrict="Kayonza"
        year="2024-25"
      />,
    )

    const changedDistrictHistory = getDistrictYieldHistory(
      evidenceRecords,
      'Kayonza',
      'Maize',
      'A',
      '2024/25',
    )
    if (changedDistrictHistory.status === 'available') {
      const updatedHistory = screen.getByRole('list', {
        name: 'Observed district yield by agricultural year',
      })
      expect(within(updatedHistory).getAllByRole('listitem')).toHaveLength(
        changedDistrictHistory.records.length,
      )
      expect(updatedHistory).not.toHaveTextContent('Nyarugenge')
    } else {
      expect(
        screen.queryByRole('list', {
          name: 'Observed district yield by agricultural year',
        }),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(
        changedDistrictHistory.message,
      )
    }
  })

  it('does not render a historical series when matching evidence is insufficient', () => {
    const unavailable = getDistrictYieldHistory(
      evidenceRecords,
      'Nyarugenge',
      'Maize',
      'C',
      '2024/25',
    )
    expect(unavailable.status).not.toBe('available')

    render(
      <DistrictProfilePage
        {...navigationProps}
        crop="maize"
        season="season-c"
        selectedDistrict="Nyarugenge"
        year="2024-25"
      />,
    )

    expect(
      screen.queryByRole('list', {
        name: 'Observed district yield by agricultural year',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /No historical series is shown/,
    )
  })
})
