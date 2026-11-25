// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DistrictSearchInput } from './DistrictSearchInput'
import { districtMetadata } from '../../district-profile/data/districtMetadata'

const supportedDistricts = districtMetadata.map(({ district }) => district)

describe('DistrictSearchInput', () => {
  it('shows one clear action only for a populated search and supports searching again', async () => {
    const onChange = vi.fn()
    const onSelect = vi.fn()
    const { rerender } = render(
      <DistrictSearchInput
        districts={['Kayonza', 'Nyarugenge']}
        onChange={onChange}
        onSelect={onSelect}
        value=""
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Search district' })
    expect(input).toHaveAttribute('type', 'text')
    expect(
      screen.queryByRole('button', { name: 'Clear district search' }),
    ).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'Kayo' } })
    rerender(
      <DistrictSearchInput
        districts={['Kayonza', 'Nyarugenge']}
        onChange={onChange}
        onSelect={onSelect}
        value="Kayo"
      />,
    )

    expect(screen.getByRole('option', { name: 'Kayonza' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Clear district search' }),
    ).toHaveLength(1)

    fireEvent.click(
      screen.getByRole('button', { name: 'Clear district search' }),
    )
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(onSelect).toHaveBeenLastCalledWith('')
    rerender(
      <DistrictSearchInput
        districts={['Kayonza', 'Nyarugenge']}
        onChange={onChange}
        onSelect={onSelect}
        value=""
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Clear district search' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await waitFor(() => expect(input).toHaveFocus())

    fireEvent.change(input, { target: { value: 'Nya' } })
    rerender(
      <DistrictSearchInput
        districts={['Kayonza', 'Nyarugenge']}
        onChange={onChange}
        onSelect={onSelect}
        value="Nya"
      />,
    )
    expect(
      screen.getByRole('option', { name: 'Nyarugenge' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Clear district search' }),
    ).toHaveLength(1)
  })

  it('finds and selects all supported districts case-insensitively, including partial queries', () => {
    cleanup()
    const onChange = vi.fn()
    const onSelect = vi.fn()
    const { rerender } = render(
      <DistrictSearchInput
        districts={supportedDistricts}
        onChange={onChange}
        onSelect={onSelect}
        openOnFocus
        value=""
      />,
    )
    const input = screen.getByRole('combobox', { name: 'Search district' })
    fireEvent.focus(input)
    expect(screen.getAllByRole('option')).toHaveLength(30)

    for (const district of supportedDistricts) {
      const query = district.toUpperCase()
      fireEvent.change(input, { target: { value: query } })
      rerender(
        <DistrictSearchInput
          districts={supportedDistricts}
          onChange={onChange}
          onSelect={onSelect}
          openOnFocus
          value={query}
        />,
      )
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        district,
      ])

      const partial = district.slice(0, Math.min(3, district.length)).toLowerCase()
      fireEvent.change(input, { target: { value: partial } })
      rerender(
        <DistrictSearchInput
          districts={supportedDistricts}
          onChange={onChange}
          onSelect={onSelect}
          openOnFocus
          value={partial}
        />,
      )
      const options = screen.getAllByRole('option')
      expect(options.some((option) => option.textContent === district)).toBe(true)
      fireEvent.click(options.find((option) => option.textContent === district)!)
      expect(onSelect).toHaveBeenLastCalledWith(district)
      fireEvent.change(input, { target: { value: '' } })
      rerender(
        <DistrictSearchInput
          districts={supportedDistricts}
          onChange={onChange}
          onSelect={onSelect}
          openOnFocus
          value=""
        />,
      )
    }
  })
})
