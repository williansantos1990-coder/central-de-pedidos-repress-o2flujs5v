import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download } from 'lucide-react'
import { CascadingFilter } from '@/components/dashboard/cascading-filter'
import { useCascadingFilters } from '@/hooks/use-cascading-filters'
import { Pedve012Table } from '@/components/reports/report-tables'
import { exportOrdersToCSV } from '@/lib/export-utils'
import { parsePBDate, formatDate } from '@/lib/order-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Pedve012Record } from '@/services/pedve012'
import type { Pedve005Record } from '@/services/pedve005'
import type { TransportadoraRecord } from '@/services/transportadoras'

interface SeparacaoReportProps {
  pedve012: Pedve012Record[]
  pedve005: Pedve005Record[]
  transportadoras: TransportadoraRecord[]
}

export function SeparacaoReport({ pedve012, pedve005, transportadoras }: SeparacaoReportProps) {
  const [search, setSearch] = useState('')
  const [selectedGrupos, setSelectedGrupos] = useState<string[]>([])
  const [cubagemMin, setCubagemMin] = useState('')
  const [cubagemMax, setCubagemMax] = useState('')
  const [nrItensMin, setNrItensMin] = useState('')
  const [nrItensMax, setNrItensMax] = useState('')
  const filters = useCascadingFilters(pedve012)

  const availableGrupos = useMemo(() => {
    const set = new Set<string>()
    pedve012.forEach((r) => {
      if (r.grupo) set.add(r.grupo)
    })
    return Array.from(set).sort()
  }, [pedve012])

  const hasExtraFilters =
    selectedGrupos.length > 0 ||
    cubagemMin !== '' ||
    cubagemMax !== '' ||
    nrItensMin !== '' ||
    nrItensMax !== ''

  const filteredBySearch = useMemo(() => {
    let result = filters.filteredRecords

    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.pedido?.toLowerCase().includes(s) ||
          r.cliente?.toLowerCase().includes(s) ||
          r.cidade?.toLowerCase().includes(s),
      )
    }

    if (selectedGrupos.length > 0) {
      const grupoSet = new Set(selectedGrupos)
      result = result.filter((r) => r.grupo && grupoSet.has(r.grupo))
    }

    const cMin = cubagemMin !== '' ? parseFloat(cubagemMin) : null
    const cMax = cubagemMax !== '' ? parseFloat(cubagemMax) : null
    if (cMin !== null || cMax !== null) {
      result = result.filter((r) => {
        const val = r.cubagem_local_estoque ?? 0
        if (cMin !== null && val < cMin) return false
        if (cMax !== null && val > cMax) return false
        return true
      })
    }

    const nMin = nrItensMin !== '' ? parseInt(nrItensMin, 10) : null
    const nMax = nrItensMax !== '' ? parseInt(nrItensMax, 10) : null
    if (nMin !== null || nMax !== null) {
      result = result.filter((r) => {
        const val = r.nr_itens ?? 0
        if (nMin !== null && val < nMin) return false
        if (nMax !== null && val > nMax) return false
        return true
      })
    }

    return result
  }, [
    filters.filteredRecords,
    search,
    selectedGrupos,
    cubagemMin,
    cubagemMax,
    nrItensMin,
    nrItensMax,
  ])

  const handleExport = () => {
    exportOrdersToCSV({ pedve012: filteredBySearch, pedve005, transportadoras })
  }

  const clearAll = () => {
    filters.clearAll()
    setSelectedGrupos([])
    setCubagemMin('')
    setCubagemMax('')
    setNrItensMin('')
    setNrItensMax('')
  }

  const hasActiveFilters = filters.hasActiveFilters || hasExtraFilters

  return (
    <div className="bg-white rounded-xl shadow-subtle border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex flex-col gap-4 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por Pedido, Cliente ou Cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20"
            />
          </div>
          <Button
            onClick={handleExport}
            className="bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel (.csv)
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">Data da Liberação</span>
            <Select
              value={filters.selectedDate ?? 'all'}
              onValueChange={(v) => filters.setSelectedDate(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[220px] h-9">
                <SelectValue placeholder="Todas as datas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                {filters.availableDates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {formatDate(parsePBDate(d))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CascadingFilter
            label="Tipo de Entrega"
            placeholder="Todos os Tipos"
            options={filters.availableTipos}
            selected={filters.selectedTipos}
            onChange={filters.setSelectedTipos}
            selectAllLabel="Todos os Tipos"
          />
          <CascadingFilter
            label="Cidade"
            placeholder="Todas as cidades"
            options={filters.availableCidades}
            selected={filters.selectedCidades}
            onChange={filters.setSelectedCidades}
            selectAllLabel="Todas as Cidades"
          />
          <CascadingFilter
            label="Grupo"
            placeholder="Todos os grupos"
            options={availableGrupos}
            selected={selectedGrupos}
            onChange={setSelectedGrupos}
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
                className="w-[90px] h-9 bg-white border-slate-200"
              />
              <span className="text-slate-400 text-xs">-</span>
              <Input
                type="number"
                placeholder="Máx"
                value={cubagemMax}
                onChange={(e) => setCubagemMax(e.target.value)}
                className="w-[90px] h-9 bg-white border-slate-200"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">Nr Itens</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Mín"
                value={nrItensMin}
                onChange={(e) => setNrItensMin(e.target.value)}
                className="w-[90px] h-9 bg-white border-slate-200"
              />
              <span className="text-slate-400 text-xs">-</span>
              <Input
                type="number"
                placeholder="Máx"
                value={nrItensMax}
                onChange={(e) => setNrItensMax(e.target.value)}
                className="w-[90px] h-9 bg-white border-slate-200"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-9 text-xs text-slate-500 hover:text-slate-700"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Pedve012Table
          items={filteredBySearch}
          pedve005={pedve005}
          transportadoras={transportadoras}
        />
      </div>
      <div className="p-4 border-t border-slate-200 flex items-center text-sm text-slate-500 bg-white">
        <span>{filteredBySearch.length} registros</span>
      </div>
    </div>
  )
}
