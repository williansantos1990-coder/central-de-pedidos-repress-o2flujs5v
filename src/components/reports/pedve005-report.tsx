import { useState, useMemo, useEffect, useCallback } from 'react'
import { getAllPedve005, type Pedve005Record } from '@/services/pedve005'
import { useRealtime } from '@/hooks/use-realtime'
import { Pedve005Table } from '@/components/reports/report-tables'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Download, Loader2 } from 'lucide-react'
import { exportPedve005ToCSV } from '@/lib/export-utils'

export function Pedve005Report() {
  const [records, setRecords] = useState<Pedve005Record[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async () => {
    try {
      const data = await getAllPedve005()
      setRecords(data)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('pedve005', () => {
    loadData()
  })

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records
    const term = searchTerm.toLowerCase()
    return records.filter(
      (r) =>
        r.pedido?.toLowerCase().includes(term) ||
        r.cliente?.toLowerCase().includes(term) ||
        r.cidade?.toLowerCase().includes(term),
    )
  }, [records, searchTerm])

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
          <h3 className="text-lg font-semibold text-slate-800">Pedidos Sintéticos</h3>
          <p className="text-sm text-slate-500">
            {filteredRecords.length} de {records.length} registros
          </p>
        </div>
        <Button
          onClick={() => exportPedve005ToCSV(filteredRecords)}
          className="bg-primary hover:bg-primary/90 text-white gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar para Excel
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por Pedido, Cliente ou Cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Pedve005Table items={filteredRecords} />
        </div>
      </div>
    </div>
  )
}
