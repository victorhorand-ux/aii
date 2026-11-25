// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { evidenceRecords } from '../../evidence/data/evidenceRecords'
import { calculateAgriculturalSignals } from '../../intelligence/agriculturalSignalEngine'
import { getDistrictYieldHistory } from '../../overview/utils/districtYieldHistory'
import {
  DistrictProfilePage,
  ProductivityTrendSection,
} from './DistrictProfilePage'

const navigationProps = {
  onOpenEvidence: vi.fn(),
  onDistrictSelect: vi.fn(),
  onNavigateOverview: vi.fn(),
  onNavigateMethodology: vi.fn(),
  onOpenInvestigationBrief: vi.fn(),
}

afterEach(cleanup)

describe('DistrictProfilePage information hierarchy', () => {
  it('selects a supported district through the shared search control', () => {
    const onDistrictSelect = vi.fn()
    const { rerender } = render(
      <DistrictProfilePage
        {...navigationProps}
        onDistrictSelect={onDistrictSelect}
        crop="maize"
        season="season-a"
        selectedDistrict="Nyarugenge"
        year="2024-25"
      />,
    )

    const search = screen.getByRole('combobox', { name: 'Search district' })
    fireEvent.change(search, { target: { value: 'Gasabo' } })
    fireEvent.click(screen.getByRole('option', { name: 'Gasabo' }))

    expect(onDistrictSelect).toHaveBeenCalledWith('Gasabo')
    rerender(
      <DistrictProfilePage
        {...navigationProps}
        onDistrictSelect={onDistrictSelect}
        crop="maize"
        season="season-a"
        selectedDistrict="Gasabo"
        year="2024-25"
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Search district' })).toHaveValue(
      'Gasabo',
    )
  })

  it('clears the query without clearing the selected district or profile data', () => {
    const onDistrictSelect = vi.fn()
    render(
      <DistrictProfilePage
        {...navigationProps}
        onDistrictSelect={onDistrictSelect}
        crop="maize"
        season="season-a"
        selectedDistrict="Nyarugenge"
        year="2024-25"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Clear district search' }))

    expect(onDistrictSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Nyarugenge' })).toBeInTheDocument()
    expect(screen.getByText(/Observed NISR district and national yields/)).toBeInTheDocument()
  })

  it('presents selected-crop analysis before portfolio, practices, and investigation evidence', () => {
    render(
      <DistrictProfilePage
        {...navigationProps}
        crop="maize"
        season="season-a"
        selectedDistrict="Nyarugenge"
        year="2024-25"
      />,
    )

    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent?.trim())
    const journey = [
      'Productivity Intelligence',
      'Productivity direction',
      'Selected-crop production and area',
      'District crop portfolio & productivity',
      'District-wide seasonal practice profile',
      'Investigation Areas',
      'Supporting evidence and calculation',
    ].map((heading) => headings.indexOf(heading))

    expect(journey.every((index) => index >= 0)).toBe(true)
    expect(journey).toEqual([...journey].sort((left, right) => left - right))
    expect(
      screen.getByText('Selected-crop productivity comparison'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/independent of the Overview crop filter/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/not a selected crop/),
    ).toBeInTheDocument()
  })
})

function productivityTrend(
  district: string,
  crop: string,
  season: 'A' | 'B' | 'C',
  year = '2024/25',
) {
  const [, trend] = calculateAgriculturalSignals(evidenceRecords, {
    district,
    crop,
    season,
    year,
  })
  return trend
}

function expectDisplayedRecords(
  list: HTMLElement,
  records: readonly (typeof evidenceRecords)[number][],
) {
  const rows = within(list).getAllByRole('listitem')
  expect(rows).toHaveLength(records.length)
  records.forEach((record, index) => {
    const row = rows[index]
    expect(row).toHaveTextContent(record.period.year)
    expect(row).toHaveTextContent(
      `${record.value?.toLocaleString('en-RW', { maximumFractionDigits: 1 })} ${record.unit}`,
    )
    expect(
      within(row).getByText(`Observed source record · ${record.period.year}`),
    ).toBeInTheDocument()
  })
}

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
    expectDisplayedRecords(history, expected.records)
    const rows = within(history).getAllByRole('listitem')
    const maximum = Math.max(
      ...expected.records.map((record) => record.value ?? 0),
    )
    expect(
      screen.getByText(
        new RegExp(`Scale: 0–${maximum.toLocaleString('en-RW')} Kg/Ha`),
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/Derived net change/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /View trend evidence/ }),
    ).toBeInTheDocument()

    const firstDisclosure = within(rows[0]).getByText(/Observed source record/)
    const summary = firstDisclosure.closest('details')?.querySelector('summary')
    expect(summary).not.toBeNull()
    if (summary) fireEvent.click(summary)
    expect(
      within(rows[0]).getByText(expected.records[0].id),
    ).toBeInTheDocument()
    expect(
      within(rows[0]).getByRole('link', { name: 'Open NISR source' }),
    ).toHaveAttribute('href', expected.records[0].source.sourceUrl)

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
      expectDisplayedRecords(updatedHistory, changedDistrictHistory.records)
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

  it('updates the exact observation series when crop and season change', () => {
    const props = {
      district: 'Nyarugenge',
      crop: 'Maize',
      season: 'A' as const,
      year: '2024/25',
      onOpenEvidence: vi.fn(),
      signal: productivityTrend('Nyarugenge', 'Maize', 'A'),
    }
    const { rerender } = render(<ProductivityTrendSection {...props} />)

    for (const selection of [
      { crop: 'Beans', season: 'A' as const },
      { crop: 'Maize', season: 'B' as const },
    ]) {
      const expected = getDistrictYieldHistory(
        evidenceRecords,
        'Nyarugenge',
        selection.crop,
        selection.season,
        props.year,
      )
      expect(expected.status).toBe('available')
      if (expected.status !== 'available') return

      rerender(
        <ProductivityTrendSection
          {...props}
          crop={selection.crop}
          season={selection.season}
          signal={productivityTrend(
            'Nyarugenge',
            selection.crop,
            selection.season,
          )}
        />,
      )

      expectDisplayedRecords(
        screen.getByRole('list', {
          name: 'Observed district yield by agricultural year',
        }),
        expected.records,
      )
    }
  })

  it('withholds observations when signal record IDs or periods differ from history', () => {
    const signal = productivityTrend('Nyarugenge', 'Maize', 'A')
    const props = {
      district: 'Nyarugenge',
      crop: 'Maize',
      season: 'A' as const,
      year: '2024/25',
      onOpenEvidence: vi.fn(),
      signal,
    }
    const { rerender } = render(<ProductivityTrendSection {...props} />)

    rerender(
      <ProductivityTrendSection
        {...props}
        signal={{ ...signal, sourceRecordIds: ['unrelated-record-id'] }}
      />,
    )
    expect(
      screen.queryByRole('list', {
        name: 'Observed district yield by agricultural year',
      }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /do not match the periods used/,
    )

    rerender(
      <ProductivityTrendSection
        {...props}
        signal={{ ...signal, periodsUsed: ['2022/23', '2024/25'] }}
      />,
    )
    expect(
      screen.queryByRole('list', {
        name: 'Observed district yield by agricultural year',
      }),
    ).not.toBeInTheDocument()
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

  it('does not draw a series when only one comparable observation exists', () => {
    const history = getDistrictYieldHistory(
      evidenceRecords,
      'Nyarugenge',
      'Maize',
      'A',
      '2023/24',
    )
    expect(history.status).toBe('insufficient')

    render(
      <ProductivityTrendSection
        crop="Maize"
        district="Nyarugenge"
        onOpenEvidence={vi.fn()}
        season="A"
        signal={productivityTrend('Nyarugenge', 'Maize', 'A', '2023/24')}
        year="2023/24"
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
