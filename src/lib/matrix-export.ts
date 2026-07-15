import { generateXlsx, downloadXlsx } from '@/lib/xlsx-generator'
import { colToLetter } from '@/lib/xlsx-generator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DailyStats {
  pedidos: number
  faturado: number
}

interface MatrixExportParams {
  sortedMonthKeys: string[]
  monthMap: Record<string, Record<number, DailyStats>>
  formatMonthLabel: (key: string) => string
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function exportPerformanceMatrixToXlsx({
  sortedMonthKeys,
  monthMap,
  formatMonthLabel,
}: MatrixExportParams) {
  const rows: (string | number)[][] = []
  const merges: string[] = []

  const headerRow1: (string | number)[] = ['Dia']
  sortedMonthKeys.forEach((mk) => {
    headerRow1.push(capitalize(formatMonthLabel(mk)), '', '')
  })
  rows.push(headerRow1)

  const headerRow2: (string | number)[] = ['']
  sortedMonthKeys.forEach(() => {
    headerRow2.push('Pedidos', 'Faturado', '%')
  })
  rows.push(headerRow2)

  sortedMonthKeys.forEach((_, i) => {
    const startCol = 2 + i * 3
    const endCol = startCol + 2
    merges.push(`${colToLetter(startCol)}1:${colToLetter(endCol)}1`)
  })

  for (let day = 1; day <= 31; day++) {
    const row: (string | number)[] = [day]
    sortedMonthKeys.forEach((mk) => {
      const stats = monthMap[mk]?.[day]
      const ped = stats?.pedidos || 0
      const fat = stats?.faturado || 0
      const pct = ped > 0 ? Number(((fat / ped) * 100).toFixed(2)) : 0
      row.push(ped, fat, pct)
    })
    rows.push(row)
  }

  const xlsxData = generateXlsx([{ name: 'Matriz de Performance', rows, merges }])
  downloadXlsx(xlsxData, 'Matriz_Performance_Operacional.xlsx')
}
