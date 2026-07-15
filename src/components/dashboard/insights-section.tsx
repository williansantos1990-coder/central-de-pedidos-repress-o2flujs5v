import { useState, useEffect } from 'react'
import { Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateInsights, type InsightMetrics } from '@/services/insights'

interface InsightsSectionProps {
  metrics: InsightMetrics
}

export function InsightsSection({ metrics }: InsightsSectionProps) {
  const [insight, setInsight] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const metricsKey = JSON.stringify(metrics)

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true)
      setError(false)
      try {
        const content = await generateInsights(metrics)
        setInsight(content)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricsKey, refreshKey])

  const handleRefresh = () => setRefreshKey((k) => k + 1)

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Insights Automáticos (IA)
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-7 px-2 text-xs"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Atualizar
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Gerando insights com IA...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          Não foi possível gerar insights no momento.
        </div>
      ) : (
        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{insight}</div>
      )}
    </div>
  )
}
