import { useState, useMemo } from 'react'
import {
  mockOrders,
  calcularDataSeparacao,
  calcularDataSegura,
  formatDate,
  formatDateTime,
} from '@/lib/mock-data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Download, Filter, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isBefore, startOfDay } from 'date-fns'

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('')

  const enrichedOrders = useMemo(() => {
    return mockOrders
      .map((order) => {
        const dataParaSeparacao = calcularDataSeparacao(order.prevEntr, order.prazoTransportadora)
        const dataSegura = calcularDataSegura(dataParaSeparacao)
        const todayStart = startOfDay(new Date())

        // Lógica de destaque: Data Segura já passou E status não é 'Finalizado' ou 'Transmitido NFe'
        const isCritical =
          isBefore(dataSegura, todayStart) &&
          !['Finalizado', 'Transmitido NFe'].includes(order.status)

        return {
          ...order,
          dataParaSeparacao,
          dataSegura,
          isCritical,
        }
      })
      .filter(
        (order) =>
          order.pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.cidade.toLowerCase().includes(searchTerm.toLowerCase()),
      )
  }, [searchTerm])

  const exportToCSV = () => {
    const headers = [
      'Pedido',
      'Cliente',
      'Envio Liberação',
      'Prev. Entrega',
      'Data p/ Separação',
      'Data Segura',
      'Tipo de Entrega',
      'Cidade',
      'Prazo Transp.',
      'Status',
      'Situação',
    ]

    const rows = enrichedOrders.map((o) => [
      o.pedido,
      `"${o.cliente}"`,
      formatDateTime(o.envioLiberacao),
      formatDate(o.prevEntr),
      formatDate(o.dataParaSeparacao),
      formatDate(o.dataSegura),
      o.tpEntrega,
      `"${o.cidade}"`,
      o.prazoTransportadora,
      o.status,
      o.situacao,
    ])

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `relatorio_separacao_${formatDate(new Date()).replace(/\//g, '')}.csv`,
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Finalizado':
      case 'Transmitido NFe':
        return 'badge-success'
      case 'Gargalo':
      case 'Atrasado':
        return 'badge-error'
      case 'Aguardando Separação':
        return 'badge-warning'
      default:
        return 'badge-info'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Relatório de Separação e Data Segura
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Acompanhamento detalhado de prazos operacionais cruzados com SLA de transportadoras.
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          className="bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar (.csv)
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-subtle border border-slate-200 overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por Pedido, Cliente ou Cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20"
            />
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-600 bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                  Pedido
                </TableHead>
                <TableHead className="font-semibold text-slate-700 min-w-[150px]">
                  Cliente
                </TableHead>
                <TableHead className="font-semibold text-slate-700 whitespace-nowrap">
                  Envio Liberação
                </TableHead>
                <TableHead className="font-semibold text-slate-700">Prev. Entr.</TableHead>
                <TableHead className="font-semibold text-primary bg-primary/5 whitespace-nowrap">
                  Data p/ Separação
                </TableHead>
                <TableHead className="font-semibold text-success bg-success/5 whitespace-nowrap">
                  Data Segura
                </TableHead>
                <TableHead className="font-semibold text-slate-700">Tipo de Entrega</TableHead>
                <TableHead className="font-semibold text-slate-700">Destino</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">
                  SLA Transp.
                </TableHead>
                <TableHead className="font-semibold text-slate-700">Status Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                enrichedOrders.map((order) => (
                  <TableRow
                    key={order.pedido}
                    className={cn(
                      'transition-colors',
                      order.isCritical
                        ? 'bg-destructive/5 hover:bg-destructive/10'
                        : 'hover:bg-slate-50',
                    )}
                  >
                    <TableCell className="font-medium text-slate-800">
                      {order.pedido}
                      {order.isCritical && (
                        <AlertCircle
                          className="w-3.5 h-3.5 text-destructive inline ml-2"
                          title="Data Segura Ultrapassada!"
                        />
                      )}
                    </TableCell>
                    <TableCell
                      className="text-slate-600 truncate max-w-[200px]"
                      title={order.cliente}
                    >
                      {order.cliente}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDateTime(order.envioLiberacao)}
                    </TableCell>
                    <TableCell className="text-slate-600">{formatDate(order.prevEntr)}</TableCell>
                    <TableCell className="font-medium text-primary bg-primary/5">
                      {formatDate(order.dataParaSeparacao)}
                    </TableCell>
                    <TableCell className="font-medium text-success bg-success/5">
                      {formatDate(order.dataSegura)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                        {order.tpEntrega}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {order.cidade} - {order.uf}
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-700">
                      {order.prazoTransportadora} d
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-[11px] px-2.5 py-1 rounded-full font-medium border',
                          getStatusBadge(order.status),
                        )}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination mock */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-white">
          <span>
            Mostrando 1 a {enrichedOrders.length} de {enrichedOrders.length} registros
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
