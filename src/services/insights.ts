import pb from '@/lib/pocketbase/client'

export interface InsightMetrics {
  pedidosLiberados: number
  finalizados: number
  naoFinalizou: number
  pedidosUrgentes: number
  liberadosApos11h: number
  slaData: { name: string; value: number }[]
}

export async function generateInsights(metrics: InsightMetrics): Promise<string> {
  const res = await pb.send('/backend/v1/insights', {
    method: 'POST',
    body: JSON.stringify(metrics),
    headers: { 'Content-Type': 'application/json' },
  })
  return res.content as string
}
