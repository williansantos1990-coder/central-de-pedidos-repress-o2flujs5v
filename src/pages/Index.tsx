import { useState, useMemo } from 'react'
import { mockOrders } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Clock, AlertTriangle, TrendingDown, Info } from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isToday, getHours } from 'date-fns'

export default function Index() {
  const [periodo, setPeriodo] = useState('hoje')

  // Metrics Calculation
  const metrics = useMemo(() => {
    const liberadosHoje = mockOrders.filter((o) => isToday(o.envioLiberacao)).length
    const aguardandoSep = mockOrders.filter((o) => o.status === 'Aguardando Separação').length

    const emFluxoGargalo = mockOrders.filter((o) =>
      ['Em Separação', 'Conferência', 'Faturado'].includes(o.status),
    ).length
    const pctGargalo = mockOrders.length
      ? Math.round((emFluxoGargalo / mockOrders.length) * 100)
      : 0

    const posCorte = mockOrders.filter((o) => getHours(o.envioLiberacao) >= 11).length

    return { liberadosHoje, aguardandoSep, pctGargalo, posCorte }
  }, [])

  // Chart Data preparation
  const volumeData = [
    { name: 'Seg', liberados: 45, finalizados: 30 },
    { name: 'Ter', liberados: 52, finalizados: 48 },
    { name: 'Qua', liberados: 38, finalizados: 40 },
    { name: 'Qui', liberados: 65, finalizados: 55 },
    { name: 'Sex', liberados: 48, finalizados: 60 },
  ]

  const statusCount = mockOrders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }))
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--warning))',
    'hsl(var(--success))',
    'hsl(var(--destructive))',
    'hsl(var(--chart-5))',
  ]

  const slaData = [
    { name: 'SP', noPrazo: 12, atrasado: 2 },
    { name: 'RJ', noPrazo: 8, atrasado: 3 },
    { name: 'MG', noPrazo: 15, atrasado: 1 },
    { name: 'PR', noPrazo: 5, atrasado: 4 },
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* Top Bar / Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Total de pedidos na base: {mockOrders.length}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-subtle hover:shadow-md transition-shadow border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Total Liberado Hoje
            </CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{metrics.liberadosHoje}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-success flex items-center">
                <TrendingDown className="w-3 h-3 mr-1 rotate-180" /> +12%
              </span>{' '}
              vs ontem
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-subtle hover:shadow-md transition-shadow border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Aguardando Separação
            </CardTitle>
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{metrics.aguardandoSep}</div>
            <p className="text-xs text-slate-500 mt-1">Pedidos aguardando picking</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'shadow-subtle hover:shadow-md transition-all border-slate-200/60 relative overflow-hidden',
            metrics.pctGargalo > 30 && 'border-warning/50 bg-warning/5',
          )}
        >
          {metrics.pctGargalo > 30 && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-warning/10 rounded-bl-full -z-0"></div>
          )}
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Gargalo Operacional
            </CardTitle>
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                metrics.pctGargalo > 30
                  ? 'bg-warning/20 text-warning animate-pulse-ring'
                  : 'bg-warning/10 text-warning',
              )}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-slate-800">{metrics.pctGargalo}%</div>
            <p className="text-xs text-slate-500 mt-1">Em trânsito int. (Separação - NFe)</p>
          </CardContent>
        </Card>

        <Card className="shadow-subtle hover:shadow-md transition-shadow border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Fora do Horário (Pós 11h)
            </CardTitle>
            <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center text-destructive">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{metrics.posCorte}</div>
            <p className="text-xs text-slate-500 mt-1">Pedidos liberados pós-corte</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-subtle border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Volume Operacional da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                liberados: { color: 'hsl(var(--primary))' },
                finalizados: { color: 'hsl(var(--success))' },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="liberados"
                    name="Liberados"
                    stroke="var(--color-liberados)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="finalizados"
                    name="Finalizados"
                    stroke="var(--color-finalizados)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
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
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
              {statusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 shadow-subtle border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
              Cumprimento de SLA por Estado
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                Cruzamento Prev.Entr x SLA Transportadora
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                noPrazo: { color: 'hsl(var(--success))' },
                atrasado: { color: 'hsl(var(--destructive))' },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={slaData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barSize={32}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="noPrazo"
                    name="No Prazo"
                    stackId="a"
                    fill="var(--color-noPrazo)"
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar
                    dataKey="atrasado"
                    name="Atrasado"
                    stackId="a"
                    fill="var(--color-atrasado)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-3">
          <Info className="w-4 h-4" /> Insights Automáticos
        </h3>
        <ul className="space-y-2">
          <li className="text-sm text-slate-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0"></span>
            A cidade de <strong>Curitiba (PR)</strong> apresenta 4 pedidos com risco de violação do
            SLA devido ao prazo de 3 dias da transportadora.
          </li>
          <li className="text-sm text-slate-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0"></span>
            Existem <strong>{metrics.posCorte} pedidos</strong> liberados após as 11:00h que
            impactarão a Data Segura da operação amanhã.
          </li>
          <li className="text-sm text-slate-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0"></span>
            A taxa de faturamento no mesmo dia melhorou 12% em relação à média da semana passada.
          </li>
        </ul>
      </div>
    </div>
  )
}
