import { useMemo, Fragment } from 'react'
import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { parsePBDate } from '@/lib/order-utils'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet } from 'lucide-react'
import { exportPerformanceMatrixToXlsx } from '@/lib/matrix-export'
import type { Pedve012Record } from '@/services/pedve012'

interface PerformanceMatrixReportProps {
  pedve012: Pedve012Record[]
}

type DailyStats = {
  pedidos: number
  faturado: number
}

type MonthMap = Record<string, Record<number, DailyStats>>

export function PerformanceMatrixReport({ pedve012 }: PerformanceMatrixReportProps) {
  const { monthMap, sortedMonthKeys } = useMemo(() => {
    const map: MonthMap = {}
    const keys = new Set<string>()

    pedve012.forEach((record) => {
      const dataLib = parsePBDate(record.envio_liberacao)
      if (dataLib && isValid(dataLib)) {
        const monthKey = format(dataLib, 'yyyy-MM')
        const day = dataLib.getDate()
        keys.add(monthKey)
        if (!map[monthKey]) map[monthKey] = {}
        if (!map[monthKey][day]) map[monthKey][day] = { pedidos: 0, faturado: 0 }
        map[monthKey][day].pedidos++
      }

      const dataNfe = parsePBDate(record.transmitir_nfe)
      if (dataNfe && isValid(dataNfe)) {
        const monthKey = format(dataNfe, 'yyyy-MM')
        const day = dataNfe.getDate()
        keys.add(monthKey)
        if (!map[monthKey]) map[monthKey] = {}
        if (!map[monthKey][day]) map[monthKey][day] = { pedidos: 0, faturado: 0 }
        map[monthKey][day].faturado++
      }
    })

    return {
      monthMap: map,
      sortedMonthKeys: Array.from(keys).sort(),
    }
  }, [pedve012])

  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const getHeatmapClass = (pct: number | null) => {
    if (pct === null) return ''
    if (pct <= 50) return 'bg-red-400/90 text-red-950 font-medium'
    if (pct <= 80) return 'bg-orange-300/90 text-orange-950 font-medium'
    if (pct <= 100) return 'bg-amber-200/90 text-amber-950 font-medium'
    return 'bg-emerald-200/90 text-emerald-950 font-medium'
  }

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1)
    return format(date, 'MMMM', { locale: ptBR })
  }

  if (sortedMonthKeys.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-subtle border border-slate-200 p-8 text-center text-slate-500">
        Nenhum dado disponível com datas de liberação ou faturamento para montar a matriz.
      </div>
    )
  }

  const handleExportExcel = () => {
    exportPerformanceMatrixToXlsx({ sortedMonthKeys, monthMap, formatMonthLabel })
  }

  return (
    <div className="bg-white rounded-xl shadow-subtle border border-slate-200 overflow-hidden flex flex-col animate-fade-in">
      <div className="flex items-center justify-end px-4 py-3 border-b border-slate-100">
        <Button
          onClick={handleExportExcel}
          variant="outline"
          className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar para o Excel
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse text-right whitespace-nowrap min-w-max">
          <thead>
            <tr>
              <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-200 p-2 font-semibold text-center w-12 shadow-[1px_0_0_0_#e2e8f0]">
                Dia
              </th>
              {sortedMonthKeys.map((mk) => (
                <th
                  key={mk}
                  colSpan={3}
                  className="border-b border-r border-slate-200 p-2 text-center capitalize font-semibold bg-slate-50 text-slate-800"
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
                  <th className="border-b border-r border-slate-200 p-2 font-medium bg-slate-50 text-center w-24 text-slate-700">
                    Pedidos
                  </th>
                  <th className="border-b border-r border-slate-200 p-2 font-medium bg-slate-50 text-center w-24 text-slate-700">
                    Faturado
                  </th>
                  <th className="border-b border-r border-slate-200 p-2 font-medium bg-slate-50 text-center w-24 text-slate-700">
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
                  const pct = ped > 0 ? (fat / ped) * 100 : null

                  return (
                    <Fragment key={`${mk}-${day}`}>
                      <td className="border-b border-r border-slate-200 p-2 text-slate-600">
                        {ped > 0 ? ped : ''}
                      </td>
                      <td className="border-b border-r border-slate-200 p-2 text-slate-600">
                        {fat > 0 ? fat : ''}
                      </td>
                      <td
                        className={cn(
                          'border-b border-r border-slate-200 p-2 text-center',
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
    </div>
  )
}
