import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import type { Pedve012Record } from '@/services/pedve012'
import { extractDateKey } from '@/lib/order-utils'

export interface CascadingFiltersResult {
  selectedDate: string | undefined
  selectedTipos: string[]
  selectedCidades: string[]
  selectedGrupos: string[]
  selectedCubagens: string[]
  selectedNrItens: string[]
  availableDates: string[]
  availableTipos: string[]
  availableCidades: string[]
  availableGrupos: string[]
  availableCubagens: string[]
  availableNrItens: string[]
  setSelectedDate: (d: string | undefined) => void
  setSelectedTipos: (t: string[]) => void
  setSelectedCidades: (c: string[]) => void
  setSelectedGrupos: (g: string[]) => void
  setSelectedCubagens: (c: string[]) => void
  setSelectedNrItens: (n: string[]) => void
  clearAll: () => void
  filteredRecords: Pedve012Record[]
  hasActiveFilters: boolean
}

type FilterKey = 'date' | 'tipos' | 'cidades' | 'grupos' | 'cubagens' | 'nritens'

export function useCascadingFilters(records: Pedve012Record[]): CascadingFiltersResult {
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedTipos, setSelectedTipos] = useState<string[]>([])
  const [selectedCidades, setSelectedCidades] = useState<string[]>([])
  const [selectedGrupos, setSelectedGrupos] = useState<string[]>([])
  const [selectedCubagens, setSelectedCubagens] = useState<string[]>([])
  const [selectedNrItens, setSelectedNrItens] = useState<string[]>([])

  const applyFiltersExcept = useCallback(
    (exclude: FilterKey) =>
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
        if (exclude !== 'grupos' && selectedGrupos.length > 0) {
          if (!selectedGrupos.includes(r.grupo || '')) return false
        }
        if (exclude !== 'cubagens' && selectedCubagens.length > 0) {
          if (r.cubagem_local_estoque == null) return false
          if (!selectedCubagens.includes(String(r.cubagem_local_estoque))) return false
        }
        if (exclude !== 'nritens' && selectedNrItens.length > 0) {
          if (r.nr_itens == null) return false
          if (!selectedNrItens.includes(String(r.nr_itens))) return false
        }
        return true
      }),
    [
      records,
      selectedDate,
      selectedTipos,
      selectedCidades,
      selectedGrupos,
      selectedCubagens,
      selectedNrItens,
    ],
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

  const availableGrupos = useMemo(() => {
    const set = new Set<string>()
    applyFiltersExcept('grupos').forEach((r) => {
      if (r.grupo) set.add(r.grupo)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [applyFiltersExcept])

  const availableCubagens = useMemo(() => {
    const set = new Set<string>()
    applyFiltersExcept('cubagens').forEach((r) => {
      if (r.cubagem_local_estoque != null) set.add(String(r.cubagem_local_estoque))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [applyFiltersExcept])

  const availableNrItens = useMemo(() => {
    const set = new Set<string>()
    applyFiltersExcept('nritens').forEach((r) => {
      if (r.nr_itens != null) set.add(String(r.nr_itens))
    })
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  }, [applyFiltersExcept])

  const filteredRecords = useMemo(() => applyFiltersExcept('' as FilterKey), [applyFiltersExcept])

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

  const pruneSelection = useCallback(
    (selection: string[], available: string[], setter: (v: string[]) => void) => {
      if (selection.length > 0) {
        const valid = selection.filter((t) => available.includes(t))
        if (valid.length !== selection.length) setter(valid)
      }
    },
    [],
  )

  useEffect(() => {
    pruneSelection(selectedTipos, availableTipos, setSelectedTipos)
  }, [availableTipos, selectedTipos, pruneSelection])
  useEffect(() => {
    pruneSelection(selectedCidades, availableCidades, setSelectedCidades)
  }, [availableCidades, selectedCidades, pruneSelection])
  useEffect(() => {
    pruneSelection(selectedGrupos, availableGrupos, setSelectedGrupos)
  }, [availableGrupos, selectedGrupos, pruneSelection])
  useEffect(() => {
    pruneSelection(selectedCubagens, availableCubagens, setSelectedCubagens)
  }, [availableCubagens, selectedCubagens, pruneSelection])
  useEffect(() => {
    pruneSelection(selectedNrItens, availableNrItens, setSelectedNrItens)
  }, [availableNrItens, selectedNrItens, pruneSelection])

  const hasActiveFilters =
    !!selectedDate ||
    selectedTipos.length > 0 ||
    selectedCidades.length > 0 ||
    selectedGrupos.length > 0 ||
    selectedCubagens.length > 0 ||
    selectedNrItens.length > 0

  const clearAll = useCallback(() => {
    setSelectedDate(undefined)
    setSelectedTipos([])
    setSelectedCidades([])
    setSelectedGrupos([])
    setSelectedCubagens([])
    setSelectedNrItens([])
  }, [])

  return {
    selectedDate,
    selectedTipos,
    selectedCidades,
    selectedGrupos,
    selectedCubagens,
    selectedNrItens,
    availableDates,
    availableTipos,
    availableCidades,
    availableGrupos,
    availableCubagens,
    availableNrItens,
    setSelectedDate,
    setSelectedTipos,
    setSelectedCidades,
    setSelectedGrupos,
    setSelectedCubagens,
    setSelectedNrItens,
    clearAll,
    filteredRecords,
    hasActiveFilters,
  }
}
