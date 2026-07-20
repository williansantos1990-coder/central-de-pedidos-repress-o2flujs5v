import { generateXlsx, downloadXlsx } from '@/lib/xlsx-generator'
import { colToLetter } from '@/lib/xlsx-generator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DailyStats {
  pedidos: number
  faturado: number
}

type PendentesMap = Record<string, Record<number, number>>

interface MatrixExportParams {
  sortedMonthKeys: string[]
  monthMap: Record<string, Record<number, DailyStats>>
  pendentesPerDay: PendentesMap
  formatMonthLabel: (key: string) => string
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getPendentesCumulative(
  pendentesPerDay: PendentesMap,
  monthKey: string,
  day: number,
): number {
  let sum = 0
  for (let d = 1; d <= day; d++) {
    sum += pendentesPerDay[monthKey]?.[d] || 0
  }
  return sum
}

export function exportPerformanceMatrixToXlsx({
  sortedMonthKeys,
  monthMap,
  pendentesPerDay,
  formatMonthLabel,
}: MatrixExportParams) {
  const rows: (string | number)[][] = []
  const merges: string[] = []

  const headerRow1: (string | number)[] = ['Dia']
  sortedMonthKeys.forEach((mk) => {
    headerRow1.push(capitalize(formatMonthLabel(mk)), '', '', '')
  })
  rows.push(headerRow1)

  const headerRow2: (string | number)[] = ['']
  sortedMonthKeys.forEach(() => {
    headerRow2.push('Pedidos', 'Faturado', 'Pendentes', '%')
  })
  rows.push(headerRow2)

  sortedMonthKeys.forEach((_, i) => {
    const startCol = 2 + i * 4
    const endCol = startCol + 3
    merges.push(`${colToLetter(startCol)}1:${colToLetter(endCol)}1`)
  })

  for (let day = 1; day <= 31; day++) {
    const row: (string | number)[] = [day]
    sortedMonthKeys.forEach((mk) => {
      const stats = monthMap[mk]?.[day]
      const ped = stats?.pedidos || 0
      const fat = stats?.faturado || 0
      const pend = getPendentesCumulative(pendentesPerDay, mk, day)
      const pct = ped > 0 ? Number(((fat / ped) * 100).toFixed(2)) : 0
      row.push(ped, fat, pend, pct)
    })
    rows.push(row)
  }

  const xlsxData = generateXlsx([{ name: 'Matriz de Performance', rows, merges }])
  downloadXlsx(xlsxData, 'Matriz_Performance_Operacional.xlsx')
}
