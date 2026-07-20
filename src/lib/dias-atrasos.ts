import { differenceInCalendarDays } from 'date-fns'

export function calcularDiasAtrasos(
  terminoSep: Date | null,
  envioLiberacao: Date | null,
): number | null {
  if (!terminoSep || !envioLiberacao) return null
  return differenceInCalendarDays(terminoSep, envioLiberacao)
}
