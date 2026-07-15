import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import type { Pedve012Record } from '@/services/pedve012'
import { extractDateKey } from '@/lib/order-utils'

export interface CascadingFiltersResult {
  selectedDate: string | undefined
  selectedTipos: string[]
  selectedCidades: string[]
  availableDates: string[]
  availableTipos: string[]
  availableCidades: string[]
  setSelectedDate: (d: string | undefined) => void
  setSelectedTipos: (t: string[]) => void
  setSelectedCidades: (c: string[]) => void
  clearAll: () => void
  filteredRecords: Pedve012Record[]
  hasActiveFilters: boolean
}

export function useCascadingFilters(records: Pedve012Record[]): CascadingFiltersResult {
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedTipos, setSelectedTipos] = useState<string[]>([])
  const [selectedCidades, setSelectedCidades] = useState<string[]>([])

  const applyFiltersExcept = useCallback(
    (exclude: string) =>
      records.filter((r) => {
        if (exclude !== 'date' && selectedDate) {
          if (extractDateKey(r.envio_liberacao) !== selectedDate) return false
        }
        if (exclude !== 'tipos' && selectedTipos.length > 0) {
          if (!selectedTipos.includes(r.tipo_entrega || '')) return false
        }
        if (exclude !== 'cidades' && selectedCidades.length > 0) {
          if (!selectedCidades.includes(r.cidade || '')) return false
        }
        return true
      }),
    [records, selectedDate, selectedTipos, selectedCidades],
  )

  const availableDates = useMemo(() => {
    const set = new Set<string>()
    applyFiltersExcept('date').forEach((r) => {
      const key = extractDateKey(r.envio_liberacao)
      if (key) set.add(key)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [applyFiltersExcept])

  const availableTipos = useMemo(() => {
    const set = new Set<string>()
    applyFiltersExcept('tipos').forEach((r) => {
      if (r.tipo_entrega) set.add(r.tipo_entrega)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [applyFiltersExcept])

  const availableCidades = useMemo(() => {
    const set = new Set<string>()
    applyFiltersExcept('cidades').forEach((r) => {
      if (r.cidade) set.add(r.cidade)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [applyFiltersExcept])

  const filteredRecords = useMemo(() => applyFiltersExcept(''), [applyFiltersExcept])

  const initialDateSet = useRef(false)
  useEffect(() => {
    if (!initialDateSet.current && availableDates.length > 0) {
      setSelectedDate(availableDates[availableDates.length - 1])
      initialDateSet.current = true
    }
  }, [availableDates])

  useEffect(() => {
    if (selectedDate && availableDates.length > 0 && !availableDates.includes(selectedDate)) {
      setSelectedDate(undefined)
    }
  }, [availableDates, selectedDate])

  useEffect(() => {
    if (selectedTipos.length > 0) {
      const valid = selectedTipos.filter((t) => availableTipos.includes(t))
      if (valid.length !== selectedTipos.length) setSelectedTipos(valid)
    }
  }, [availableTipos, selectedTipos])

  useEffect(() => {
    if (selectedCidades.length > 0) {
      const valid = selectedCidades.filter((c) => availableCidades.includes(c))
      if (valid.length !== selectedCidades.length) setSelectedCidades(valid)
    }
  }, [availableCidades, selectedCidades])

  const hasActiveFilters = !!selectedDate || selectedTipos.length > 0 || selectedCidades.length > 0

  const clearAll = useCallback(() => {
    setSelectedDate(undefined)
    setSelectedTipos([])
    setSelectedCidades([])
  }, [])

  return {
    selectedDate,
    selectedTipos,
    selectedCidades,
    availableDates,
    availableTipos,
    availableCidades,
    setSelectedDate,
    setSelectedTipos,
    setSelectedCidades,
    clearAll,
    filteredRecords,
    hasActiveFilters,
  }
}
