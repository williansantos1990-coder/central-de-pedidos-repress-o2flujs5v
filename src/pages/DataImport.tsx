import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadCloud, FileSpreadsheet, CheckCircle2, Loader2, X, Database } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { importExcelData } from '@/services/import'
import { cn } from '@/lib/utils'

interface ImportSlot {
  collection: string
  title: string
  description: string
  expectedColumns: string[]
  file: File | null
}

function FileUploadCard({
  slot,
  onFileSelect,
}: {
  slot: ImportSlot
  onFileSelect: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card
      className={cn(
        'border-slate-200 shadow-sm relative overflow-hidden group transition-all',
        slot.file && 'border-primary/40 ring-1 ring-primary/20',
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full transition-colors',
          slot.file ? 'bg-primary' : 'bg-slate-300 group-hover:bg-primary/50',
        )}
      />
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-500" />
              {slot.title}
            </CardTitle>
            <CardDescription className="text-xs mt-1">{slot.description}</CardDescription>
          </div>
          {slot.file && <CheckCircle2 className="w-5 h-5 text-success" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Colunas Esperadas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {slot.expectedColumns.map((col) => (
              <span
                key={col}
                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />
        {slot.file ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 border border-primary/20">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-slate-700 truncate">{slot.file.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFileSelect(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
                className="text-slate-400 hover:text-destructive transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Substituir Arquivo
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            className="w-full relative border-dashed"
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Selecionar Arquivo .xlsx
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function DataImport() {
  const [slots, setSlots] = useState<ImportSlot[]>([
    {
      collection: 'pedve005',
      title: 'PEDVE005',
      description: 'Dados de emissão e prazos originais.',
      expectedColumns: ['Pedido', 'Cliente', 'Prev.Entr', 'Tp. Entrega', 'Cidade', 'UF'],
      file: null,
    },
    {
      collection: 'pedve012',
      title: 'PEDVE012',
      description: 'Etapas detalhadas e status atual do pedido.',
      expectedColumns: ['Pedido', 'Envio Liberação', 'Status', 'Situação'],
      file: null,
    },
    {
      collection: 'transportadoras',
      title: 'Transportadoras',
      description: 'Prazos (SLA) baseados em Cidade/Estado.',
      expectedColumns: ['DESTINO', 'UF', 'PRAZO TRANSPORTADORA', 'MODAL'],
      file: null,
    },
  ])
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleFileSelect = (collection: string, file: File | null) => {
    setSlots((prev) => prev.map((s) => (s.collection === collection ? { ...s, file } : s)))
    setCompleted(false)
  }

  const handleProcess = async () => {
    const selected = slots.filter((s) => s.file !== null)

    if (selected.length === 0) {
      setCompleted(true)
      return
    }

    setProcessing(true)
    setCompleted(false)

    try {
      for (const slot of selected) {
        await importExcelData(slot.collection, slot.file!)
      }
      setCompleted(true)
      toast.success('Finalizado!', {
        description: 'Importação concluída com sucesso.',
      })
      setSlots((prev) => prev.map((s) => ({ ...s, file: null })))
    } catch (error) {
      toast.error('Erro na importação', {
        description:
          error instanceof Error ? error.message : 'Ocorreu um erro durante a importação.',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Dados</h2>
        <p className="text-slate-500 text-sm mt-1">
          Importe arquivos Excel (.xlsx) para atualizar as coleções do banco de dados.
        </p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Database className="h-5 w-5 !text-primary" />
        <AlertTitle className="font-bold">Importação de Dados</AlertTitle>
        <AlertDescription className="text-sm mt-2 leading-relaxed">
          Selecione um ou mais arquivos .xlsx para importar. Os dados das coleções selecionadas
          serão substituídos completamente — os dados das demais permanecem intactos.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {slots.map((slot) => (
          <FileUploadCard
            key={slot.collection}
            slot={slot}
            onFileSelect={(file) => handleFileSelect(slot.collection, file)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 mt-8">
        <Button onClick={handleProcess} disabled={processing} size="lg" className="min-w-[200px]">
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            'Processar'
          )}
        </Button>
        {completed && (
          <div className="flex items-center gap-2 text-success animate-fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Finalizado!</span>
          </div>
        )}
      </div>
    </div>
  )
}
