import { extractZipEntries } from '@/lib/zip-reader'

export interface SheetData {
  name: string
  headers: string[]
  rows: string[][]
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
}

function bytesToString(bytes: Uint8Array): string {
  const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
  return new TextDecoder('utf-8').decode(hasBom ? bytes.slice(3) : bytes)
}

function extractSharedStrings(xml: string): string[] {
  const strings: string[] = []
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const sis = doc.getElementsByTagName('si')
  for (let i = 0; i < sis.length; i++) {
    let text = ''
    const ts = sis[i].getElementsByTagName('t')
    for (let j = 0; j < ts.length; j++) text += decodeXml(ts[j].textContent || '')
    strings.push(text)
  }
  return strings
}

function getSheetFileMap(zip: Record<string, Uint8Array>): Record<string, string> {
  const map: Record<string, string> = {}
  const wbXml = zip['xl/workbook.xml'] ? bytesToString(zip['xl/workbook.xml']) : null
  const relsXml = zip['xl/_rels/workbook.xml.rels']
    ? bytesToString(zip['xl/_rels/workbook.xml.rels'])
    : null
  if (!wbXml || !relsXml) return map

  const rels: Record<string, string> = {}
  const relsDoc = new DOMParser().parseFromString(relsXml, 'text/xml')
  const relEls = relsDoc.getElementsByTagName('Relationship')
  for (let i = 0; i < relEls.length; i++) {
    const id = relEls[i].getAttribute('Id')
    let target = relEls[i].getAttribute('Target')
    if (id && target) {
      if (target.charAt(0) === '/') target = target.substring(1)
      else if (target.indexOf('xl/') !== 0) target = 'xl/' + target
      rels[id] = decodeXml(target)
    }
  }

  const wbDoc = new DOMParser().parseFromString(wbXml, 'text/xml')
  const sheetEls = wbDoc.getElementsByTagName('sheet')
  for (let i = 0; i < sheetEls.length; i++) {
    const name = sheetEls[i].getAttribute('name')
    const rId = sheetEls[i].getAttribute('r:id') || sheetEls[i].getAttribute('Id')
    if (name && rId && rels[rId]) map[decodeXml(name).toLowerCase()] = rels[rId]
  }
  return map
}

function parseWorksheet(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = []
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const rowEls = doc.getElementsByTagName('row')
  for (let i = 0; i < rowEls.length; i++) {
    const cells: string[] = []
    const cEls = rowEls[i].getElementsByTagName('c')
    for (let j = 0; j < cEls.length; j++) {
      const cell = cEls[j]
      const r = cell.getAttribute('r') || ''
      const colMatch = r.match(/([A-Z]+)\d+/)
      let colIdx = 0
      if (colMatch) {
        for (let ci = 0; ci < colMatch[1].length; ci++)
          colIdx = colIdx * 26 + (colMatch[1].charCodeAt(ci) - 64)
        colIdx--
      }
      const type = cell.getAttribute('t') || 'n'
      let value = ''
      const vEls = cell.getElementsByTagName('v')
      const tEls = cell.getElementsByTagName('t')
      if (type === 's' && vEls.length > 0) {
        value = sharedStrings[parseInt(vEls[0].textContent || '0', 10)] || ''
      } else if (type === 'str' || type === 'inlineStr') {
        if (tEls.length > 0) value = decodeXml(tEls[0].textContent || '')
      } else if (vEls.length > 0) {
        value = vEls[0].textContent || ''
      }
      while (cells.length <= colIdx) cells.push('')
      cells[colIdx] = value
    }
    if (cells.length > 0) rows.push(cells)
  }
  return rows
}

export async function parseXlsx(file: File): Promise<SheetData[]> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const zip = await extractZipEntries(bytes)
  const sharedStrings = zip['xl/sharedStrings.xml']
    ? extractSharedStrings(bytesToString(zip['xl/sharedStrings.xml']))
    : []
  const sheetMap = getSheetFileMap(zip)
  const sheets: SheetData[] = []
  for (const [name, file2] of Object.entries(sheetMap)) {
    const data = zip[file2]
    if (!data) continue
    const rows = parseWorksheet(bytesToString(data), sharedStrings)
    if (rows.length >= 2) sheets.push({ name, headers: rows[0], rows: rows.slice(1) })
  }
  return sheets
}

export async function parseCsvFile(file: File): Promise<SheetData[]> {
  let text = await file.text()
  if (text.charCodeAt(0) === 0xfeff) text = text.substring(1)
  const delimiter = text.split('\n')[0].indexOf(';') >= 0 ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === delimiter) {
        row.push(field)
        field = ''
      } else if (ch === '\r') {
        // ignore standalone carriage returns; newlines handled below
      } else if (ch === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  if (rows.length < 2) return []
  return [{ name: 'csv', headers: rows[0], rows: rows.slice(1) }]
}
