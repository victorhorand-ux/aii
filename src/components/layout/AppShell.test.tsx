// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AppShell } from './AppShell'

const navigation = [
  'Overview',
  'District Profile',
  'Investigation Brief',
  'Evidence',
  'Data & Methodology',
] as const

describe('AppShell sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    window.innerWidth = 1440
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('automatically collapses at limited desktop widths and follows the content offset', () => {
    render(
      <AppShell
        activePage="Overview"
        navigation={navigation}
        onNavigate={() => undefined}
      >
        <h1>Overview</h1>
      </AppShell>,
    )

    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible()
    window.innerWidth = 1024
    fireEvent(window, new Event('resize'))
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()
    expect(screen.getByRole('main').parentElement?.parentElement).toHaveClass(
      'lg:pl-16',
    )
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument()
  })

  it('allows a manual override and restores it on the next render', () => {
    const renderShell = () =>
      render(
        <AppShell
          activePage="Overview"
          navigation={navigation}
          onNavigate={() => undefined}
        >
          <h1>Overview</h1>
        </AppShell>,
      )

    const first = renderShell()
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
    expect(localStorage.getItem('aii-sidebar-collapsed')).toBe('true')
    first.unmount()

    renderShell()
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
  })
})
