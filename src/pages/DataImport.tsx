import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Package,
  FileSpreadsheet,
  Truck,
  X,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { importAllData, type ImportAllResult, type ImportProgress } from '@/services/import'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileSlot {
  key: 'pedve012' | 'pedve005' | 'transportadoras'
  label: string
  description: string
  icon: typeof Package
  sheet: string
}

const FILE_SLOTS: FileSlot[] = [
  {
    key: 'pedve012',
    label: 'PEDVE012',
    description: 'Pedidos de venda',
    icon: Package,
    sheet: 'PEDVE012',
  },
  {
    key: 'pedve005',
    label: 'PEDVE005',
    description: 'Previsão de entrada',
    icon: FileSpreadsheet,
    sheet: 'PEDVE005',
  },
  {
    key: 'transportadoras',
    label: 'Transportadoras',
    description: 'Prazos e modais',
    icon: Truck,
    sheet: 'Transportadoras',
  },
]

export default function DataImport() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<Record<string, File | null>>({
    pedve012: null,
    pedve005: null,
    transportadoras: null,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportAllResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const hasAnyFile = Object.values(files).some((f) => f !== null)
  const progressPct =
    progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  const handleFileChange = (key: string, file: File | undefined) => {
    if (!file) return
    setError(null)
    setResult(null)
    setFiles((prev) => ({ ...prev, [key]: file }))
  }

  const handleRemoveFile = (key: string) => {
    setFiles((prev) => ({ ...prev, [key]: null }))
    if (fileInputRefs.current[key]) fileInputRefs.current[key]!.value = ''
  }

  const handleImport = async () => {
    if (!hasAnyFile) return
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress({ phase: 'parsing', collection: '', current: 0, total: 0, message: 'Iniciando...' })
    try {
      const res = await importAllData(files, setProgress)
      setResult(res)
      res.results.forEach((r) => {
        if (r.errors > 0) toast.warning(`${r.label}: ${r.message}`)
        else if (r.inserted > 0) toast.success(`${r.label}: ${r.inserted} registros importados`)
        else toast.info(`${r.label}: ${r.message}`)
      })
    } catch (err: any) {
      const msg = err?.message || 'Erro ao importar dados.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const handleReset = () => {
    setFiles({ pedve012: null, pedve005: null, transportadoras: null })
    setResult(null)
    setError(null)
    Object.keys(fileInputRefs.current).forEach((key) => {
      if (fileInputRefs.current[key]) fileInputRefs.current[key]!.value = ''
    })
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importação de Dados</h1>
          <p className="text-sm text-muted-foreground">
            Processe planilhas localmente no navegador
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FILE_SLOTS.map((slot) => {
          const selectedFile = files[slot.key]
          const Icon = slot.icon
          return (
            <Card
              key={slot.key}
              className={cn(
                'transition-all duration-200',
                selectedFile && 'ring-2 ring-primary/40',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{slot.label}</CardTitle>
                    <CardDescription className="text-xs">{slot.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <input
                  ref={(el) => {
                    fileInputRefs.current[slot.key] = el
                  }}
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(e) => handleFileChange(slot.key, e.target.files?.[0])}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleRemoveFile(slot.key)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    className="w-full border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
                    onClick={() => fileInputRefs.current[slot.key]?.click()}
                    disabled={loading}
                  >
                    <Upload className="h-7 w-7 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground block">Selecionar arquivo</span>
                    <span className="text-[10px] text-muted-foreground/60 block mt-1">
                      .xlsx ou .csv
                    </span>
                  </button>
                )}
                <p className="text-[10px] text-muted-foreground/70 mt-2 text-center">
                  Aba: <strong>{slot.sheet}</strong>
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {loading && progress && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress.message}
              </span>
              {progress.total > 0 && (
                <span className="text-muted-foreground">
                  {progress.current}/{progress.total}
                </span>
              )}
            </div>
            <Progress value={progressPct} className="h-2" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert
          className={
            result.results.every((r) => r.errors === 0)
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-amber-500/30 bg-amber-500/5'
          }
        >
          {result.results.every((r) => r.errors === 0) ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <AlertDescription>
            <span className="font-semibold text-base">Importação Concluída</span>
            <div className="mt-3 space-y-1.5">
              {result.results.map((r) => (
                <div
                  key={r.collection}
                  className="flex items-center justify-between text-sm bg-white/60 rounded-md px-3 py-1.5"
                >
                  <span className="font-medium">{r.label}</span>
                  <span className={cn('text-muted-foreground', r.errors > 0 && 'text-destructive')}>
                    {r.message}
                  </span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleImport}
          disabled={loading || !hasAnyFile}
          className="flex-1 h-11 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            'Processar'
          )}
        </Button>
        {hasAnyFile && !loading && (
          <Button variant="outline" onClick={handleReset} className="h-11">
            Limpar
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Info className="h-4 w-4 text-primary" />
              Instruções
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
              <li>
                Os arquivos são <strong>processados no navegador</strong> — nenhum arquivo bruto é
                enviado ao servidor
              </li>
              <li>
                PEDVE012.xlsx deve conter uma aba <strong>"PEDVE012"</strong>
              </li>
              <li>
                PEDVE005.xlsx deve conter uma aba <strong>"PEDVE005"</strong>
              </li>
              <li>
                Transportadoras.xlsx deve conter uma aba <strong>"Transportadoras"</strong>
              </li>
              <li>
                Outras abas (ex: "Variáveis") são <strong>ignoradas automaticamente</strong>
              </li>
              <li>
                Formatatos aceitos: <strong>XLSX</strong> e <strong>CSV</strong> (UTF-8)
              </li>
              <li>
                Os dados existentes serão <strong>removidos</strong> antes da importação dos novos
              </li>
              <li>Datas devem estar no formato DD/MM/AAAA ou AAAA-MM-DD</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
