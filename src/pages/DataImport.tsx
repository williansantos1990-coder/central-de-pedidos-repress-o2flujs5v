import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadCloud, FileSpreadsheet, Database, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FileSlotProps {
  title: string
  description: string
  expectedColumns: string[]
  status: 'empty' | 'uploaded'
}

function FileSlot({ title, description, expectedColumns, status }: FileSlotProps) {
  return (
    <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
      <div
        className={`absolute top-0 left-0 w-1 h-full ${status === 'uploaded' ? 'bg-success' : 'bg-slate-300 group-hover:bg-primary/50 transition-colors'}`}
      ></div>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-500" />
              {title}
            </CardTitle>
            <CardDescription className="text-xs mt-1">{description}</CardDescription>
          </div>
          {status === 'uploaded' && <CheckCircle2 className="w-5 h-5 text-success" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Colunas Esperadas (Exemplo)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {expectedColumns.map((col) => (
              <span
                key={col}
                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
        <Button
          variant={status === 'uploaded' ? 'outline' : 'default'}
          className="w-full relative border-dashed"
          disabled // Disabled to enforce the database import rule
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          {status === 'uploaded' ? 'Substituir Arquivo' : 'Selecionar Arquivo .xlsx'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function DataImport() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Dados</h2>
        <p className="text-slate-500 text-sm mt-1">
          Gerencie as fontes de dados que alimentam a Central de Pedidos.
        </p>
      </div>

      <Alert className="bg-primary/5 border-primary/20 text-primary">
        <Database className="h-5 w-5 !text-primary" />
        <AlertTitle className="font-bold">Atenção Crítica: Banco de Dados Necessário</AlertTitle>
        <AlertDescription className="text-sm mt-2 leading-relaxed">
          Para garantir a performance e as funcionalidades em tempo real desta aplicação,{' '}
          <strong>
            é estritamente proibido incorporar dados massivos de planilhas (.xlsx/.csv) diretamente
            no código-fonte.
          </strong>
          <br />
          <br />
          Para utilizar seus dados reais (PEDVE005, PEDVE012 e Transportadoras), você deve
          conectá-los ao banco de dados utilizando a integração de Backend (ícone de servidor no
          header do painel principal). A aplicação lerá as tabelas diretamente de lá em tempo de
          execução.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <FileSlot
          title="PEDVE005"
          description="Dados de emissão e prazos originais."
          expectedColumns={['Pedido', 'Cliente', 'Prev.Entr', 'Tp. Entrega']}
          status="empty"
        />
        <FileSlot
          title="PEDVE012"
          description="Etapas detalhadas e status atual do pedido."
          expectedColumns={['Pedido', 'Envio Liberação', 'Status', 'Situação']}
          status="empty"
        />
        <FileSlot
          title="Transportadoras"
          description="Prazos (SLA) baseados em Cidade/Estado (Life/Alejo)."
          expectedColumns={['DESTINO', 'UF', 'PRAZO TRANSPORTADORA', 'MODAL']}
          status="empty"
        />
      </div>

      <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Como funciona o sincronismo?</h4>
          <p className="text-sm text-slate-500 mt-1">
            A "Central de Pedidos" cruza a coluna{' '}
            <code className="bg-slate-100 px-1 rounded">Pedido</code> entre o PEDVE005 e PEDVE012
            para obter a linha do tempo completa. Em seguida, cruza a coluna{' '}
            <code className="bg-slate-100 px-1 rounded">Cidade/DESTINO</code> com a tabela de
            Transportadoras para subtrair o SLA e descobrir a <strong>Data para Separação</strong>{' '}
            exata.
          </p>
        </div>
      </div>
    </div>
  )
}
