import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { MapPin } from 'lucide-react'
import type { Pedve012Record } from '@/services/pedve012'

interface GeographySectionProps {
  records: Pedve012Record[]
}

export function GeographySection({ records }: GeographySectionProps) {
  const cityData = useMemo(() => {
    const counts: Record<string, number> = {}
    records.forEach((r) => {
      if (r.cidade) {
        const city = r.cidade.toUpperCase().trim()
        counts[city] = (counts[city] || 0) + 1
      }
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [records])

  const ufData = useMemo(() => {
    const counts: Record<string, number> = {}
    records.forEach((r) => {
      if (r.uf) counts[r.uf] = (counts[r.uf] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [records])

  if (records.length === 0) return null

  return (
    <Card className="shadow-subtle border-slate-200/60">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Distribuição Geográfica de Entregas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cityData.length > 0 ? (
          <ChartContainer
            config={{ value: { color: 'hsl(var(--primary))' } }}
            className="h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cityData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tickFormatter={(v) => (v.length > 14 ? v.substring(0, 14) + '...' : v)}
                />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar
                  dataKey="value"
                  name="Pedidos"
                  fill="var(--color-value)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[280px] w-full flex items-center justify-center text-slate-400">
            Nenhum dado geográfico disponível
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {ufData.map((uf) => (
            <div
              key={uf.name}
              className="flex items-center gap-1.5 bg-slate-100 rounded-md px-2.5 py-1 text-xs"
            >
              <span className="font-semibold text-slate-700">{uf.name}</span>
              <span className="text-slate-500">{uf.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
