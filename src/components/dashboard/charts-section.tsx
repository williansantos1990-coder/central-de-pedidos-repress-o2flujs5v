import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Label,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

const PIE_COLORS = [
  'hsl(var(--success))',
  'hsl(var(--destructive))',
  'hsl(var(--primary))',
  'hsl(45 95% 50%)',
  'hsl(280 65% 60%)',
]

interface ChartsSectionProps {
  statusData: { name: string; value: number }[]
  situacaoData: { name: string; value: number }[]
}

function EmptyState() {
  return (
    <div className="h-[280px] w-full flex items-center justify-center text-slate-400">
      Nenhum dado para o período
    </div>
  )
}

export function ChartsSection({ statusData, situacaoData }: ChartsSectionProps) {
  const totalSituacao = situacaoData.reduce((s, c) => s + c.value, 0)
  const noPrazo = situacaoData.find((d) => d.name === 'Normal')?.value || 0
  const slaPercent = totalSituacao > 0 ? Math.round((noPrazo / totalSituacao) * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-subtle border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Distribuição por Status (PEDVE005)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ChartContainer
              config={{ value: { color: 'hsl(var(--primary))' } }}
              className="h-[280px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v.length > 12 ? v.substring(0, 12) + '...' : v)}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="value"
                    name="Pedidos"
                    fill="var(--color-value)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-subtle border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Cumprimento de SLA (PEDVE012)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalSituacao > 0 ? (
            <ChartContainer config={{}} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={situacaoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {situacaoData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-slate-800 text-3xl font-bold"
                              >
                                {slaPercent}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-slate-500 text-xs"
                              >
                                No Prazo
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyState />
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {situacaoData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-sm text-slate-600">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {s.name}: <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
