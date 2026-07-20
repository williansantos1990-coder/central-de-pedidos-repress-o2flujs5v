import { useEffect, useState, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getAllPedve012, type Pedve012Record } from '@/services/pedve012'
import { useRealtime } from '@/hooks/use-realtime'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { parsePBDate } from '@/lib/order-utils'

type DailyStats = {
  pedidos: number
  faturado: number
}

type MonthMap = {
  [monthKey: string]: {
    [day: number]: DailyStats
  }
}

type PendentesMap = Record<string, Record<number, number>>

const PENDING_SITUACOES = new Set(['Aguardando Liberação', 'Em Separação'])

export function PerformanceMatrix() {
  const [data, setData] = useState<Pedve012Record[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    getAllPedve012()
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('pedve012', () => {
    loadData()
  })

  const monthMap: MonthMap = {}
  const monthKeysSet = new Set<string>()
  const pendentesPerDay: PendentesMap = {}

  data.forEach((record) => {
    const dataLib = parsePBDate(record.envio_liberacao)
    if (dataLib && isValid(dataLib)) {
      const monthKey = format(dataLib, 'yyyy-MM')
      const day = dataLib.getDate()
      monthKeysSet.add(monthKey)
      if (!monthMap[monthKey]) monthMap[monthKey] = {}
      if (!monthMap[monthKey][day]) monthMap[monthKey][day] = { pedidos: 0, faturado: 0 }
      monthMap[monthKey][day].pedidos++
    }

    const dataNfe = parsePBDate(record.transmitir_nfe)
    if (dataNfe && isValid(dataNfe)) {
      const monthKey = format(dataNfe, 'yyyy-MM')
      const day = dataNfe.getDate()
      monthKeysSet.add(monthKey)
      if (!monthMap[monthKey]) monthMap[monthKey] = {}
      if (!monthMap[monthKey][day]) monthMap[monthKey][day] = { pedidos: 0, faturado: 0 }
      monthMap[monthKey][day].faturado++
    }

    if (PENDING_SITUACOES.has(record.situacao)) {
      const dataEmissao = parsePBDate(record.emissao)
      if (dataEmissao && isValid(dataEmissao)) {
        const monthKey = format(dataEmissao, 'yyyy-MM')
        const day = dataEmissao.getDate()
        monthKeysSet.add(monthKey)
        if (!pendentesPerDay[monthKey]) pendentesPerDay[monthKey] = {}
        pendentesPerDay[monthKey][day] = (pendentesPerDay[monthKey][day] || 0) + 1
      }
    }
  })

  const sortedMonthKeys = Array.from(monthKeysSet).sort()
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const getPendentesCumulative = (monthKey: string, day: number) => {
    let sum = 0
    for (let d = 1; d <= day; d++) {
      sum += pendentesPerDay[monthKey]?.[d] || 0
    }
    return sum
  }

  const getHeatmapClass = (pct: number | null) => {
    if (pct === null) return ''
    if (pct < 50) return 'bg-red-400/80 text-red-950 font-semibold'
    if (pct < 80) return 'bg-orange-300/80 text-orange-950 font-semibold'
    if (pct < 100) return 'bg-amber-200/80 text-amber-950 font-semibold'
    return 'bg-emerald-200/80 text-emerald-950 font-semibold'
  }

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return format(date, 'MMMM', { locale: ptBR })
  }

  return (
    <Card className="shadow-subtle border-slate-200">
      <CardHeader className="pb-4 border-b border-slate-100">
        <CardTitle className="text-xl text-slate-800">Matriz de Performance Operacional</CardTitle>
        <CardDescription>
          Comparativo mensal do volume de pedidos liberados x faturados (independente de filtros
          globais).
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <Skeleton className="w-full h-[400px] rounded-md" />
        ) : sortedMonthKeys.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-500 border rounded-md">
            Nenhum dado com datas de liberação ou faturamento disponível.
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-md border border-slate-200 shadow-sm relative">
            <table className="w-full text-sm border-collapse text-right whitespace-nowrap min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-200 p-2 font-semibold text-center w-12 shadow-[1px_0_0_0_#e2e8f0]">
                    Dia
                  </th>
                  {sortedMonthKeys.map((mk) => (
                    <th
                      key={mk}
                      colSpan={4}
                      className="border-b border-r border-slate-200 p-2 text-center capitalize font-semibold bg-slate-50"
                    >
                      {formatMonthLabel(mk)}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-200 p-2 font-semibold text-center shadow-[1px_0_0_0_#e2e8f0]">
                    {/* Spacer for Day column */}
                  </th>
                  {sortedMonthKeys.map((mk) => (
                    <Fragment key={`${mk}-sub`}>
                      <th className="border-b border-r border-slate-200 p-2 font-medium bg-slate-50 text-center w-24">
                        Pedidos
                      </th>
                      <th className="border-b border-r border-slate-200 p-2 font-medium bg-slate-50 text-center w-24">
                        Faturado
                      </th>
                      <th className="border-b border-r border-slate-200 p-2 font-medium bg-slate-50 text-center w-24">
                        Pendentes
                      </th>
                      <th className="border-b border-r border-slate-200 p-2 font-medium bg-slate-50 text-center w-24">
                        %
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50/50 border-b border-r border-slate-200 p-2 text-center font-medium text-slate-700 shadow-[1px_0_0_0_#e2e8f0] transition-colors">
                      {day}
                    </td>
                    {sortedMonthKeys.map((mk) => {
                      const stats = monthMap[mk]?.[day]
                      const ped = stats?.pedidos || 0
                      const fat = stats?.faturado || 0
                      const pend = getPendentesCumulative(mk, day)
                      const pct = ped > 0 ? (fat / ped) * 100 : null

                      return (
                        <Fragment key={`${mk}-${day}`}>
                          <td className="border-b border-r border-slate-200 p-2 text-slate-600">
                            {ped > 0 ? ped : ''}
                          </td>
                          <td className="border-b border-r border-slate-200 p-2 text-slate-600">
                            {fat > 0 ? fat : ''}
                          </td>
                          <td className="border-b border-r border-slate-200 p-2 text-slate-600">
                            {pend > 0 ? pend : ''}
                          </td>
                          <td
                            className={cn(
                              'border-b border-r border-slate-200 p-2',
                              getHeatmapClass(pct),
                            )}
                          >
                            {pct !== null ? `${pct.toFixed(2).replace('.', ',')}%` : ''}
                          </td>
                        </Fragment>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
