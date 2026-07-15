import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TransportadoraRecord } from '@/services/transportadoras'

interface TransportadorasReportProps {
  transportadoras: TransportadoraRecord[]
}

export function TransportadorasReport({ transportadoras }: TransportadorasReportProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return transportadoras
    const s = search.toLowerCase()
    return transportadoras.filter(
      (r) =>
        r.destino?.toLowerCase().includes(s) ||
        r.transportadora?.toLowerCase().includes(s) ||
        r.uf?.toLowerCase().includes(s),
    )
  }, [transportadoras, search])

  const handleExport = () => {
    const headers = [
      'Destino',
      'UF',
      'Transportadora',
      'Padrão',
      'Prazo de Entrega',
      'Prazo Transportadora',
    ]
    const rows = filtered.map((t) => [
      `"${t.destino || ''}"`,
      `"${t.uf || ''}"`,
      `"${t.transportadora || ''}"`,
      `"${t.padrao_do_exceda || ''}"`,
      t.prazo_de_entrega || 0,
      `"${t.prazo_transportadora || ''}"`,
    ])
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'transportadoras.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl shadow-subtle border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por Destino, Transportadora ou UF..."
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
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-700">Destino</TableHead>
              <TableHead className="font-semibold text-slate-700">UF</TableHead>
              <TableHead className="font-semibold text-slate-700">Transportadora</TableHead>
              <TableHead className="font-semibold text-slate-700">Padrão</TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">
                Prazo (dias)
              </TableHead>
              <TableHead className="font-semibold text-slate-700">Prazo Transportadora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Nenhuma transportadora encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-800">{t.destino}</TableCell>
                  <TableCell className="text-slate-600">{t.uf || '-'}</TableCell>
                  <TableCell className="text-slate-600">{t.transportadora || '-'}</TableCell>
                  <TableCell className="text-slate-600">{t.padrao_do_exceda || '-'}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700">
                    {t.prazo_de_entrega || 0}
                  </TableCell>
                  <TableCell className="text-slate-600">{t.prazo_transportadora || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="p-4 border-t border-slate-200 flex items-center text-sm text-slate-500 bg-white">
        <span>{filtered.length} registros</span>
      </div>
    </div>
  )
}
