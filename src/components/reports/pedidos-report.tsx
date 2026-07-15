import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download } from 'lucide-react'
import { Pedve005Table } from '@/components/reports/report-tables'
import { exportOrdersToCSV } from '@/lib/export-utils'
import type { Pedve005Record } from '@/services/pedve005'
import type { Pedve012Record } from '@/services/pedve012'
import type { TransportadoraRecord } from '@/services/transportadoras'

interface PedidosReportProps {
  pedve005: Pedve005Record[]
  pedve012: Pedve012Record[]
  transportadoras: TransportadoraRecord[]
}

export function PedidosReport({ pedve005, pedve012, transportadoras }: PedidosReportProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return pedve005
    const s = search.toLowerCase()
    return pedve005.filter(
      (r) =>
        r.pedido?.toLowerCase().includes(s) ||
        r.cliente?.toLowerCase().includes(s) ||
        r.cidade?.toLowerCase().includes(s),
    )
  }, [pedve005, search])

  const handleExport = () => {
    exportOrdersToCSV({ pedve012, pedve005: filtered, transportadoras })
  }

  return (
    <div className="bg-white rounded-xl shadow-subtle border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
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
      <div className="overflow-x-auto">
        <Pedve005Table items={filtered} />
      </div>
      <div className="p-4 border-t border-slate-200 flex items-center text-sm text-slate-500 bg-white">
        <span>{filtered.length} registros</span>
      </div>
    </div>
  )
}
