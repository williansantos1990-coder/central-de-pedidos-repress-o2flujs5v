import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { importData, type ImportResult } from '@/services/import'
import { toast } from 'sonner'

const COLLECTIONS = [
  { value: 'pedve012', label: 'Pedidos (PEDVE012)' },
  { value: 'pedve005', label: 'Previsão de Entrada (PEDVE005)' },
  { value: 'transportadoras', label: 'Transportadoras' },
]

export default function DataImport() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      setError('Formato XLSX não suportado. Salve o arquivo como CSV (UTF-8) e tente novamente.')
      setSelectedFile(null)
      return
    }

    if (!fileName.endsWith('.csv')) {
      setError('Apenas arquivos CSV são suportados.')
      setSelectedFile(null)
      return
    }

    setError(null)
    setSelectedFile(file)
    setResult(null)
  }

  const handleImport = async () => {
    if (!selectedCollection) {
      setError('Selecione uma coleção para importar.')
      return
    }
    if (!selectedFile) {
      setError('Selecione um arquivo CSV.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await importData(selectedCollection, selectedFile)
      setResult(res)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao importar dados.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importação de Dados</h1>
          <p className="text-sm text-muted-foreground">Importe dados a partir de arquivos CSV</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar CSV
          </CardTitle>
          <CardDescription>
            Selecione a coleção de destino e o arquivo CSV. Os dados existentes serão substituídos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Coleção</label>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma coleção" />
              </SelectTrigger>
              <SelectContent>
                {COLLECTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Arquivo CSV</label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo CSV
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{result.message}</span>
                <br />
                <span className="text-xs text-muted-foreground">
                  Registros removidos: {result.deleted} | Registros inseridos: {result.inserted}
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={loading || !selectedCollection || !selectedFile}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                'Importar'
              )}
            </Button>
            {(selectedFile || result) && (
              <Button variant="outline" onClick={handleReset} disabled={loading}>
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Instruções:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>O arquivo deve estar no formato CSV codificado em UTF-8</li>
              <li>
                No Excel, use "Salvar como" e selecione o formato "CSV UTF-8 (Separado por
                vírgulas)"
              </li>
              <li>A primeira linha deve conter os cabeçalhos das colunas</li>
              <li>Os dados existentes na coleção serão removidos antes da importação</li>
              <li>As datas devem estar no formato DD/MM/AAAA ou AAAA-MM-DD</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
