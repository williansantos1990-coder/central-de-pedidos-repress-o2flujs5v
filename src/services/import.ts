import pb from '@/lib/pocketbase/client'
import { parseXlsx, parseCsvFile, type SheetData } from '@/lib/xlsx-parser'
import { mapSheetData } from '@/lib/data-mapper'

export interface ImportCollectionResult {
  collection: string
  label: string
  deleted: number
  inserted: number
  errors: number
  message: string
}

export interface ImportAllResult {
  success: boolean
  results: ImportCollectionResult[]
  message: string
}

export interface ImportProgress {
  phase: 'parsing' | 'importing' | 'done' | 'error'
  collection: string
  current: number
  total: number
  message: string
}

const COLLECTION_CONFIG: Record<
  string,
  { label: string; sheet: string; required: string[]; fields: string[] }
> = {
  pedve012: {
    label: 'PEDVE012',
    sheet: 'PEDVE012',
    required: ['pedido'],
    fields: [
      'pedido',
      'situacao',
      'nota_fiscal',
      'cod_cliente',
      'cliente',
      'uf',
      'cidade',
      'bairro',
      'grupo',
      'tipo_entrega',
      'digitado',
      'ate_envio',
      'enviado',
      'liberado',
      'ate_lib',
      'ate_sep',
      'separado',
      'conferido',
      'ate_conf',
      'ate_nf',
      'nf_gerada',
      'ate_nfe',
      'ate_transito',
      'ate_entrega',
      'qtd_total',
      'nr_itens',
      'nr_ends',
      'cubagem_local_estoque',
      'volume_local_estoque',
      'emissao',
      'prev_entr',
      'digitacao',
      'envio_liberacao',
      'liberacao',
      'inicio_sep',
      'termino_sep',
      'inicio_conf',
      'termino_conf',
      'gerar_nf',
      'transmitir_nfe',
      'transito',
      'entrega',
      'nfe_transmitida',
      'colocado_transito',
      'marcado_entrega',
    ],
  },
  pedve005: {
    label: 'PEDVE005',
    sheet: 'PEDVE005',
    required: ['pedido'],
    fields: [
      'pedido',
      'emissao',
      'cliente',
      'status',
      'tp_estoque',
      'bairro',
      'cidade',
      'doc_remessa',
      'prev_entr',
      'rota',
      'tp_entrega',
      'receb_destino',
      'vl_ped_rs',
      'vl_ord_rem_rs',
      'cubagem_local_estoque',
      'volume_local_estoque',
      'qtd_itens',
      'observacao',
    ],
  },
  transportadoras: {
    label: 'Transportadoras',
    sheet: 'Transportadoras',
    required: ['destino'],
    fields: [
      'destino',
      'uf',
      'transportadora',
      'padrao_do_exceda',
      'prazo_de_entrega',
      'prazo_transportadora',
    ],
  },
}

const BATCH_SIZE = 200

async function parseFile(file: File, sheetName: string): Promise<SheetData | null> {
  const isXlsx = file.name.toLowerCase().endsWith('.xlsx')
  const sheets = isXlsx ? await parseXlsx(file) : await parseCsvFile(file)
  return sheets.find((s) => s.name.toLowerCase() === sheetName.toLowerCase()) || sheets[0] || null
}

async function sendBatch(collection: string, records: Record<string, unknown>[], clear: boolean) {
  const data = await pb.send('/backend/v1/import', {
    method: 'POST',
    body: JSON.stringify({ collection, records, clear }),
    headers: { 'Content-Type': 'application/json' },
  })
  return { inserted: data.inserted || 0, errors: data.errors || 0 }
}

export async function importAllData(
  files: { pedve012?: File | null; pedve005?: File | null; transportadoras?: File | null },
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportAllResult> {
  const results: ImportCollectionResult[] = []
  const entries = Object.entries(files).filter(([, f]) => f !== null) as [string, File][]

  for (const [key, file] of entries) {
    const config = COLLECTION_CONFIG[key]
    if (!config) continue
    onProgress?.({
      phase: 'parsing',
      collection: key,
      current: 0,
      total: 0,
      message: `Processando ${config.label}...`,
    })
    try {
      const sheet = await parseFile(file, config.sheet)
      if (!sheet) {
        results.push({
          collection: key,
          label: config.label,
          deleted: 0,
          inserted: 0,
          errors: 0,
          message: `Aba "${config.sheet}" não encontrada`,
        })
        continue
      }
      const { records, headerMap } = mapSheetData(sheet.headers, sheet.rows, config.fields)
      const mappedFields = new Set(headerMap.map((h) => h.field))
      const missing = config.required.filter((f) => !mappedFields.has(f))
      if (missing.length > 0) {
        results.push({
          collection: key,
          label: config.label,
          deleted: 0,
          inserted: 0,
          errors: 0,
          message: `Campos obrigatórios ausentes: ${missing.join(', ')}`,
        })
        continue
      }
      if (records.length === 0) {
        results.push({
          collection: key,
          label: config.label,
          deleted: 0,
          inserted: 0,
          errors: 0,
          message: 'Nenhum dado válido encontrado',
        })
        continue
      }
      let inserted = 0,
        errors = 0
      const totalBatches = Math.ceil(records.length / BATCH_SIZE)
      for (let i = 0; i < totalBatches; i++) {
        const batch = records.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
        onProgress?.({
          phase: 'importing',
          collection: key,
          current: i + 1,
          total: totalBatches,
          message: `Enviando lote ${i + 1}/${totalBatches} (${batch.length} registros)`,
        })
        const res = await sendBatch(key, batch, i === 0)
        inserted += res.inserted
        errors += res.errors
      }
      results.push({
        collection: key,
        label: config.label,
        deleted: 0,
        inserted,
        errors,
        message:
          errors > 0
            ? `${inserted} inseridos, ${errors} erros`
            : `${inserted} registros importados com sucesso`,
      })
    } catch (err: any) {
      results.push({
        collection: key,
        label: config.label,
        deleted: 0,
        inserted: 0,
        errors: 1,
        message: err?.message || 'Erro ao processar',
      })
    }
  }
  onProgress?.({
    phase: 'done',
    collection: '',
    current: 0,
    total: 0,
    message: 'Importação concluída',
  })
  return { success: true, results, message: 'Importação concluída' }
}
