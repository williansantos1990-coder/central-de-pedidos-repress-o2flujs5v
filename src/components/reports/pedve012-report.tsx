import { useState, useMemo, useEffect, useCallback } from 'react'
import { getAllPedve012, type Pedve012Record } from '@/services/pedve012'
import { getAllPedve005, type Pedve005Record } from '@/services/pedve005'
import { getAllTransportadoras, type TransportadoraRecord } from '@/services/transportadoras'
import { useRealtime } from '@/hooks/use-realtime'
import { useCascadingFilters } from '@/hooks/use-cascading-filters'
import { Pedve012Table } from '@/components/reports/report-tables'
import { CascadingFilter } from '@/components/dashboard/cascading-filter'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Download, Loader2, X } from 'lucide-react'
import { exportOrdersToCSV } from '@/lib/export-utils'

export function Pedve012Report() {
  const [records, setRecords] = useState<Pedve012Record[]>([])
  const [transportadoras, setTransportadoras] = useState<TransportadoraRecord[]>([])
  const [pedve005, setPedve005] = useState<Pedve005Record[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrupos, setSelectedGrupos] = useState<string[]>([])
  const [cubagemMin, setCubagemMin] = useState('')
  const [cubagemMax, setCubagemMax] = useState('')
  const [selectedNrItens, setSelectedNrItens] = useState<string[]>([])

  const loadData = useCallback(async () => {
    try {
      const [p012, p005, transp] = await Promise.all([
        getAllPedve012(),
        getAllPedve005(),
        getAllTransportadoras(),
      ])
      setRecords(p012)
      setPedve005(p005)
      setTransportadoras(transp)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('pedve012', () => {
    loadData()
  })
  useRealtime('pedve005', () => {
    loadData()
  })
  useRealtime('transportadoras', () => {
    loadData()
  })

  const filters = useCascadingFilters(records)

  const availableGrupos = useMemo(() => {
    const set = new Set<string>()
    records.forEach((r) => {
      if (r.grupo) set.add(r.grupo)
    })
    return Array.from(set).sort()
  }, [records])

  const availableNrItens = useMemo(() => {
    const set = new Set<string>()
    records.forEach((r) => {
      if (r.nr_itens != null) set.add(String(r.nr_itens))
    })
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  }, [records])

  const hasExtraFilters =
    selectedGrupos.length > 0 ||
    cubagemMin !== '' ||
    cubagemMax !== '' ||
    selectedNrItens.length > 0

  const searchedRecords = useMemo(() => {
    let result = filters.filteredRecords

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (r) =>
          r.pedido?.toLowerCase().includes(term) ||
          r.cliente?.toLowerCase().includes(term) ||
          r.cidade?.toLowerCase().includes(term),
      )
    }

    if (selectedGrupos.length > 0) {
      const grupoSet = new Set(selectedGrupos)
      result = result.filter((r) => r.grupo && grupoSet.has(r.grupo))
    }

    const cMin = cubagemMin !== '' ? cubagemMin : null
    const cMax = cubagemMax !== '' ? cubagemMax : null
    if (cMin !== null || cMax !== null) {
      result = result.filter((r) => {
        const val = r.cubagem_local_estoque ?? ''
        if (cMin !== null && val < cMin) return false
        if (cMax !== null && val > cMax) return false
        return true
      })
    }

    if (selectedNrItens.length > 0) {
      const nrItensSet = new Set(selectedNrItens)
      result = result.filter((r) => {
        if (r.nr_itens == null) return false
        return nrItensSet.has(String(r.nr_itens))
      })
    }

    return result
  }, [filters.filteredRecords, searchTerm, selectedGrupos, cubagemMin, cubagemMax, selectedNrItens])

  const handleExport = () => {
    exportOrdersToCSV({
      pedve012: searchedRecords,
      pedve005,
      transportadoras,
    })
  }

  const clearAll = () => {
    filters.clearAll()
    setSelectedGrupos([])
    setCubagemMin('')
    setCubagemMax('')
    setSelectedNrItens([])
  }

  const hasActiveFilters = filters.hasActiveFilters || hasExtraFilters

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Separação e Data Segura</h3>
          <p className="text-sm text-slate-500">
            {searchedRecords.length} de {records.length} registros
          </p>
        </div>
        <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-white gap-2">
          <Download className="w-4 h-4" />
          Exportar para Excel
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por Pedido, Cliente ou Cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <CascadingFilter
            label="Data da Liberação"
            placeholder="Selecione a data"
            options={filters.availableDates}
            selected={filters.selectedDate ? [filters.selectedDate] : []}
            onChange={(v) => {
              if (v.length === 0 || v.length > 1) {
                filters.setSelectedDate(undefined)
              } else {
                filters.setSelectedDate(v[0])
              }
            }}
            emptyMessage="Nenhuma data disponível"
            width="w-[200px]"
            selectAllLabel="Todas as Datas"
          />
          <CascadingFilter
            label="Tipo de Entrega"
            placeholder="Selecione o tipo"
            options={filters.availableTipos}
            selected={filters.selectedTipos}
            onChange={filters.setSelectedTipos}
            emptyMessage="Nenhum tipo disponível"
            width="w-[200px]"
            selectAllLabel="Todos os Tipos"
          />
          <CascadingFilter
            label="Cidade"
            placeholder="Selecione a cidade"
            options={filters.availableCidades}
            selected={filters.selectedCidades}
            onChange={filters.setSelectedCidades}
            emptyMessage="Nenhuma cidade disponível"
            width="w-[200px]"
            selectAllLabel="Todas as Cidades"
          />
          <CascadingFilter
            label="Grupo"
            placeholder="Selecione o grupo"
            options={availableGrupos}
            selected={selectedGrupos}
            onChange={setSelectedGrupos}
            emptyMessage="Nenhum grupo disponível"
            width="w-[200px]"
            selectAllLabel="Todos os Grupos"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">Cubagem Local Estoque</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Mín"
                value={cubagemMin}
                onChange={(e) => setCubagemMin(e.target.value)}
                className="w-[90px] h-9"
              />
              <span className="text-slate-400 text-xs">-</span>
              <Input
                type="number"
                placeholder="Máx"
                value={cubagemMax}
                onChange={(e) => setCubagemMax(e.target.value)}
                className="w-[90px] h-9"
              />
            </div>
          </div>
          <CascadingFilter
            label="Nr Itens"
            placeholder="Selecione o nr itens"
            options={availableNrItens}
            selected={selectedNrItens}
            onChange={setSelectedNrItens}
            emptyMessage="Nenhum nr itens disponível"
            width="w-[200px]"
            selectAllLabel="Todos os Nr Itens"
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Pedve012Table
            items={searchedRecords}
            pedve005={pedve005}
            transportadoras={transportadoras}
          />
        </div>
      </div>
    </div>
  )
}
