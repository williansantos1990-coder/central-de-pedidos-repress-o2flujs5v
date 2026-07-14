import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isBefore, startOfDay } from 'date-fns'
import type { Pedve012Record } from '@/services/pedve012'
import type { Pedve005Record } from '@/services/pedve005'
import type { TransportadoraRecord } from '@/services/transportadoras'
import {
  parsePBDate,
  formatDate,
  formatCurrency,
  formatNumber,
  calcularDataSeparacao,
  calcularDataSegura,
  findPrazoByCity,
  getStatusBadgeClass,
} from '@/lib/order-utils'

interface Pedve012TableProps {
  items: Pedve012Record[]
  transportadoras: TransportadoraRecord[]
}

export function Pedve012Table({ items, transportadoras }: Pedve012TableProps) {
  if (items.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-500">
        Nenhum pedido encontrado.
      </div>
    )
  }
  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Pedido</TableHead>
          <TableHead className="font-semibold text-slate-700 min-w-[150px]">Cliente</TableHead>
          <TableHead className="font-semibold text-slate-700">Destino</TableHead>
          <TableHead className="font-semibold text-slate-700">Tipo Entrega</TableHead>
          <TableHead className="font-semibold text-slate-700">Situação</TableHead>
          <TableHead className="font-semibold text-slate-700">Emissão</TableHead>
          <TableHead className="font-semibold text-slate-700">Prev. Entr.</TableHead>
          <TableHead className="font-semibold text-primary bg-primary/5">Data Sep.</TableHead>
          <TableHead className="font-semibold text-success bg-success/5">Data Segura</TableHead>
          <TableHead className="font-semibold text-slate-700 text-center">Itens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((order) => {
          const prazoDias = findPrazoByCity(order.cidade, transportadoras)
          const prevEntr = parsePBDate(order.prev_entr)
          const dataSep = prevEntr && prazoDias ? calcularDataSeparacao(prevEntr, prazoDias) : null
          const dataSegura = dataSep ? calcularDataSegura(dataSep) : null
          const isCritical =
            dataSegura &&
            isBefore(dataSegura, startOfDay(new Date())) &&
            !['Finalizado', 'Transmitido NFe'].includes(order.situacao)
          return (
            <TableRow
              key={order.id}
              className={cn(
                'transition-colors',
                isCritical ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-slate-50',
              )}
            >
              <TableCell className="font-medium text-slate-800">
                {order.pedido}
                {isCritical && <AlertCircle className="w-3.5 h-3.5 text-destructive inline ml-2" />}
              </TableCell>
              <TableCell className="text-slate-600 truncate max-w-[200px]" title={order.cliente}>
                {order.cliente}
              </TableCell>
              <TableCell className="text-slate-600 text-sm">
                {order.cidade} - {order.uf}
              </TableCell>
              <TableCell className="text-slate-600">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                  {order.tipo_entrega || '-'}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-full font-medium border',
                    getStatusBadgeClass(order.situacao),
                  )}
                >
                  {order.situacao || '-'}
                </span>
              </TableCell>
              <TableCell className="text-slate-600">
                {formatDate(parsePBDate(order.emissao))}
              </TableCell>
              <TableCell className="text-slate-600">{formatDate(prevEntr)}</TableCell>
              <TableCell className="font-medium text-primary bg-primary/5">
                {formatDate(dataSep)}
              </TableCell>
              <TableCell className="font-medium text-success bg-success/5">
                {formatDate(dataSegura)}
              </TableCell>
              <TableCell className="text-center font-medium text-slate-700">
                {order.nr_itens || 0}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

interface Pedve005TableProps {
  items: Pedve005Record[]
}

export function Pedve005Table({ items }: Pedve005TableProps) {
  if (items.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-500">
        Nenhum pedido encontrado.
      </div>
    )
  }
  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Pedido</TableHead>
          <TableHead className="font-semibold text-slate-700 min-w-[150px]">Cliente</TableHead>
          <TableHead className="font-semibold text-slate-700">Cidade</TableHead>
          <TableHead className="font-semibold text-slate-700">Status</TableHead>
          <TableHead className="font-semibold text-slate-700">Tp. Entrega</TableHead>
          <TableHead className="font-semibold text-slate-700">Emissão</TableHead>
          <TableHead className="font-semibold text-slate-700">Prev. Entr.</TableHead>
          <TableHead className="font-semibold text-slate-700 text-right">Valor</TableHead>
          <TableHead className="font-semibold text-slate-700 text-center">Itens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((order) => (
          <TableRow key={order.id} className="hover:bg-slate-50">
            <TableCell className="font-medium text-slate-800">{order.pedido}</TableCell>
            <TableCell className="text-slate-600 truncate max-w-[200px]" title={order.cliente}>
              {order.cliente}
            </TableCell>
            <TableCell className="text-slate-600 text-sm">{order.cidade || '-'}</TableCell>
            <TableCell>
              <span
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-full font-medium border',
                  getStatusBadgeClass(order.status),
                )}
              >
                {order.status || '-'}
              </span>
            </TableCell>
            <TableCell className="text-slate-600">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                {order.tp_entrega || '-'}
              </span>
            </TableCell>
            <TableCell className="text-slate-600">
              {formatDate(parsePBDate(order.emissao))}
            </TableCell>
            <TableCell className="text-slate-600">
              {formatDate(parsePBDate(order.prev_entr))}
            </TableCell>
            <TableCell className="text-right font-medium text-slate-700">
              {formatCurrency(order.vl_ped_rs)}
            </TableCell>
            <TableCell className="text-center text-slate-700">{order.qtd_itens || 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
