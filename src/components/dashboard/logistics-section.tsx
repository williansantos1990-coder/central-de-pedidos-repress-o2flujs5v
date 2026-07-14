import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Truck } from 'lucide-react'
import type { TransportadoraRecord } from '@/services/transportadoras'
import type { Pedve012Record } from '@/services/pedve012'

interface LogisticsSectionProps {
  transportadoras: TransportadoraRecord[]
  pedve012: Pedve012Record[]
}

export function LogisticsSection({ transportadoras, pedve012 }: LogisticsSectionProps) {
  const data = useMemo(() => {
    return transportadoras
      .map((t) => {
        const orderCount = pedve012.filter(
          (p) => p.cidade?.toUpperCase().trim() === t.destino?.toUpperCase().trim(),
        ).length
        return { ...t, orderCount }
      })
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 8)
  }, [transportadoras, pedve012])

  if (transportadoras.length === 0) return null

  return (
    <Card className="shadow-subtle border-slate-200/60">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          Eficiência Logística por Transportadora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-slate-700">Destino</TableHead>
              <TableHead className="text-slate-700">UF</TableHead>
              <TableHead className="text-slate-700">Transportadora</TableHead>
              <TableHead className="text-slate-700 text-center">Prazo (dias)</TableHead>
              <TableHead className="text-slate-700 text-center">Pedidos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((t, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-slate-800">{t.destino}</TableCell>
                <TableCell className="text-slate-600">{t.uf || '-'}</TableCell>
                <TableCell className="text-slate-600">{t.transportadora || '-'}</TableCell>
                <TableCell className="text-center text-slate-700">
                  {t.prazo_de_entrega ?? '-'}
                </TableCell>
                <TableCell className="text-center font-semibold text-primary">
                  {t.orderCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
