import { createZip } from '@/lib/zip-writer'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function colToLetter(col: number): string {
  let result = ''
  while (col > 0) {
    const mod = (col - 1) % 26
    result = String.fromCharCode(65 + mod) + result
    col = Math.floor((col - 1) / 26)
  }
  return result
}

export interface XlsxSheetData {
  name: string
  rows: (string | number)[][]
  merges?: string[]
}

function buildSheetXml(sheet: XlsxSheetData): string {
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  xml +=
    '<cols><col min="1" max="1" width="8" customWidth="1"/><col min="2" max="16384" width="14" customWidth="1"/></cols>'
  xml += '<sheetData>'

  sheet.rows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 1
    xml += `<row r="${rowNum}">`
    row.forEach((cell, colIdx) => {
      const ref = `${colToLetter(colIdx + 1)}${rowNum}`
      if (typeof cell === 'number') {
        xml += `<c r="${ref}"><v>${cell}</v></c>`
      } else {
        xml += `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`
      }
    })
    xml += '</row>'
  })

  xml += '</sheetData>'
  if (sheet.merges?.length) {
    xml += `<mergeCells count="${sheet.merges.length}">`
    sheet.merges.forEach((ref) => (xml += `<mergeCell ref="${ref}"/>`))
    xml += '</mergeCells>'
  }
  xml += '</worksheet>'
  return xml
}

function buildContentTypes(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
}

function buildRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
}

function buildWorkbook(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Matriz" sheetId="1" r:id="rId1"/></sheets></workbook>`
}

function buildWorkbookRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
}

export function generateXlsx(sheets: XlsxSheetData[]): Uint8Array {
  const encoder = new TextEncoder()
  const files = [
    { name: '[Content_Types].xml', data: encoder.encode(buildContentTypes()) },
    { name: '_rels/.rels', data: encoder.encode(buildRels()) },
    { name: 'xl/workbook.xml', data: encoder.encode(buildWorkbook()) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(buildWorkbookRels()) },
    { name: 'xl/worksheets/sheet1.xml', data: encoder.encode(buildSheetXml(sheets[0])) },
  ]
  return createZip(files)
}

export function downloadXlsx(data: Uint8Array, filename: string) {
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
