import { differenceInCalendarDays } from 'date-fns'

export function calcularDiasAtrasos(
  dataSeparacao: Date | null,
  envioLiberacao: Date | null,
): number | null {
  if (!dataSeparacao || !envioLiberacao) return null
  return differenceInCalendarDays(dataSeparacao, envioLiberacao)
}
