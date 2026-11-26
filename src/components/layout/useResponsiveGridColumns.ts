import { useCallback, useEffect, useState } from 'react'

export function useResponsiveGridColumns(
  breakpoints: readonly { minWidth: number; columns: number }[],
) {
  const getColumns = useCallback(() => {
    if (typeof window === 'undefined') return 1
    return breakpoints.reduce(
      (columns, breakpoint) =>
        window.innerWidth >= breakpoint.minWidth
          ? breakpoint.columns
          : columns,
      1,
    )
  }, [breakpoints])
  const [columns, setColumns] = useState(getColumns)

  useEffect(() => {
    const updateColumns = () => setColumns(getColumns())
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [getColumns])

  return columns
}
