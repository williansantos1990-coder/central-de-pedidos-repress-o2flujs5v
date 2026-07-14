function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeHeader(header: string): string {
  return removeAccents(header.toLowerCase().trim()).replace(/[^a-z0-9]/g, '')
}

const ALIASES: Record<string, string[]> = {
  pedido: ['pedido', 'ped', 'numero', 'num', 'numped', 'npedido'],
  emissao: ['emissao', 'dataemissao', 'dtemissao'],
  situacao: ['situacao', 'sit'],
  nota_fiscal: ['notafiscal', 'nf'],
  qtd_total: ['qtdtotal', 'qtdtot', 'qttotal'],
  nr_itens: ['nritens', 'nritem'],
  nr_ends: ['nrends', 'nrend'],
  cod_cliente: ['codcliente', 'codclient', 'codigocliente'],
  cliente: ['cliente', 'client', 'nome', 'razao', 'razaosocial'],
  uf: ['uf', 'estado', 'state'],
  cidade: ['cidade', 'city'],
  bairro: ['bairro', 'district'],
  grupo: ['grupo', 'group'],
  tipo_entrega: ['tipoentrega', 'tpentrega', 'tpent', 'tipodeentrega', 'tipentrega'],
  prev_entr: ['preventr', 'preventrada', 'prevista', 'dataentrada', 'previsaoentrada'],
  cubagem_local_estoque: ['cubagemlocalestoque', 'cubagem', 'cubagemlocal'],
  volume_local_estoque: ['volumelocalestoque', 'volume', 'volumelocal'],
  digitacao: ['digitacao', 'datadigitacao'],
  digitado: ['digitado'],
  envio_liberacao: ['envioliberacao', 'envio', 'enviolib'],
  ate_envio: ['ateenvio', 'ateenv'],
  enviado: ['enviado'],
  liberacao: ['liberacao', 'dataliberacao'],
  ate_lib: ['atelib'],
  liberado: ['liberado'],
  inicio_sep: ['iniciosep', 'inicioseparacao'],
  termino_sep: ['terminosep', 'terminoseparacao'],
  ate_sep: ['atesep'],
  separado: ['separado'],
  inicio_conf: ['inicioconf', 'inicioconferencia'],
  termino_conf: ['terminoconf', 'terminoconferencia'],
  ate_conf: ['ateconf'],
  conferido: ['conferido'],
  gerar_nf: ['gerarnf', 'gerarnota'],
  ate_nf: ['atenf'],
  nf_gerada: ['nfgerada'],
  transmitir_nfe: ['transmitirnfe', 'transmitir', 'datanfe'],
  ate_nfe: ['atenfe', 'atnfe', 'atenota', 'tempoatenfe'],
  nfe_transmitida: ['nfetransmitida', 'datanfetransmitida', 'nfetransm'],
  transito: ['transito', 'datatransito'],
  ate_transito: ['atetransito', 'atetransit', 'tempoatetransito'],
  colocado_transito: ['colocadotransito', 'datacolocadotransito', 'colocadotransit'],
  entrega: ['entrega', 'dataentrega'],
  ate_entrega: ['ateentrega', 'ateentreg', 'tempoateentrega'],
  marcado_entrega: ['marcadoentrega', 'datamarcadoentrega', 'marcadoentreg'],
  destino: ['destino'],
  prazo_transportadora: ['prazotransportadora', 'prazotransp', 'prazo'],
  prazo_de_entrega: ['prazoentrega', 'prazodeentrega'],
  padrao_do_exceda: ['padraoexceda', 'padraodoexceda', 'exceda', 'padrao'],
  transportadora: ['transportadora', 'transp', 'carrier'],
  status: ['status', 'stat'],
  tp_estoque: ['tpestoque', 'tipoestoque'],
  doc_remessa: ['docremessa', 'documentoremessa', 'remessa'],
  rota: ['rota', 'route'],
  tp_entrega: ['tpentrega', 'tipoentrega', 'tipodeentrega', 'tipentrega'],
  receb_destino: ['recebdestino', 'recebimentodestino'],
  vl_ped_rs: ['vlpedrs', 'valorpedido', 'vlped'],
  vl_ord_rem_rs: ['vlordremrs', 'valorordemremessa', 'vlordrem'],
  qtd_itens: ['qtditens', 'qtditem', 'quantidadeitens'],
  observacao: ['observacao', 'obs'],
}

const DATE_FIELDS = new Set([
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
])

const NUMBER_FIELDS = new Set([
  'qtd_total',
  'nr_itens',
  'nr_ends',
  'cubagem_local_estoque',
  'volume_local_estoque',
  'vl_ped_rs',
  'vl_ord_rem_rs',
  'qtd_itens',
  'prazo_de_entrega',
])

function matchField(normalized: string, fields: string[]): string | null {
  for (const fn of fields) {
    if (ALIASES[fn]?.includes(normalized)) return fn
  }
  for (const fn of fields) {
    if (
      fn
        .toLowerCase()
        .replace(/_/g, '')
        .replace(/[^a-z0-9]/g, '') === normalized
    )
      return fn
  }
  return null
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n
}

export function formatDateValue(val: string): string | null {
  const trimmed = val.trim()
  const serial = parseFloat(trimmed)
  if (!isNaN(serial) && trimmed.match(/^\d+(\.\d+)?$/) && serial > 1 && serial < 60000) {
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000))
    const dp = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
    return serial !== Math.floor(serial)
      ? `${dp} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:00`
      : dp
  }
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (dmy) {
    const dp = `${dmy[3]}-${pad2(+dmy[2])}-${pad2(+dmy[1])}`
    return dmy[4] ? `${dp} ${pad2(+dmy[4])}:${dmy[5]}:00` : dp
  }
  const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/)
  if (ymd) {
    const dp = `${ymd[1]}-${pad2(+ymd[2])}-${pad2(+ymd[3])}`
    return ymd[4] ? `${dp} ${pad2(+ymd[4])}:${ymd[5]}:00` : dp
  }
  const dmyDash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
  if (dmyDash) return `${dmyDash[3]}-${pad2(+dmyDash[2])}-${pad2(+dmyDash[1])}`
  return null
}

export interface MappedData {
  records: Record<string, unknown>[]
  headerMap: { col: number; field: string }[]
}

export function mapSheetData(
  headers: string[],
  rows: string[][],
  fieldNames: string[],
): MappedData {
  const headerMap: { col: number; field: string }[] = []
  for (let h = 0; h < headers.length; h++) {
    if (!headers[h] || headers[h].trim() === '') continue
    const matched = matchField(normalizeHeader(headers[h].toString()), fieldNames)
    if (matched) headerMap.push({ col: h, field: matched })
  }
  const records: Record<string, unknown>[] = []
  for (const row of rows) {
    if (row.every((c) => !c || c.trim() === '')) continue
    const record: Record<string, unknown> = {}
    for (const { col, field } of headerMap) {
      const value = row[col]
      if (value === undefined || value === null || value === '') continue
      if (DATE_FIELDS.has(field)) {
        const formatted = formatDateValue(value)
        if (formatted) record[field] = formatted
      } else if (NUMBER_FIELDS.has(field)) {
        const num = parseFloat(value.toString().replace(',', '.'))
        if (!isNaN(num)) record[field] = num
      } else {
        record[field] = value.toString().trim()
      }
    }
    records.push(record)
  }
  return { records, headerMap }
}
