routerAdd(
  'POST',
  '/backend/v1/import/{collection}',
  (e) => {
    const collectionName = e.request.pathValue('collection')
    const userId = e.auth && e.auth.id

    if (!userId) return e.unauthorizedError('auth required')

    const allowedCollections = ['pedve012', 'pedve005', 'transportadoras']
    if (allowedCollections.indexOf(collectionName) === -1) {
      return e.badRequestError('collection not allowed for import')
    }

    const uploadedFiles = e.findUploadedFiles('file')
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return e.badRequestError('Nenhum arquivo enviado')
    }

    let collection
    try {
      collection = $app.findCollectionByNameOrId(collectionName)
    } catch (_) {
      return e.badRequestError('collection not found')
    }

    const uploadedFile = uploadedFiles[0]
    let fileBytes
    try {
      fileBytes = uploadedFile.Bytes()
    } catch (err) {
      return e.badRequestError('Erro ao ler arquivo')
    }

    if (!fileBytes || fileBytes.length === 0) {
      return e.badRequestError('Arquivo vazio')
    }

    if (fileBytes.length >= 2 && fileBytes[0] === 0x50 && fileBytes[1] === 0x4b) {
      return e.badRequestError(
        'Formato XLSX nao suportado. Salve o arquivo como CSV (UTF-8) e tente novamente.',
      )
    }

    function bytesToString(bytes) {
      const hasBom =
        bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
      const start = hasBom ? 3 : 0
      let result = ''
      let i = start
      let isValidUtf8 = true
      while (i < bytes.length) {
        const b = bytes[i]
        if (b < 0x80) {
          result += String.fromCharCode(b)
          i++
        } else if (b >= 0xc2 && b < 0xe0) {
          if (i + 1 < bytes.length && (bytes[i + 1] & 0xc0) === 0x80) {
            result += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
            i += 2
          } else {
            isValidUtf8 = false
            break
          }
        } else if (b >= 0xe0 && b < 0xf0) {
          if (
            i + 2 < bytes.length &&
            (bytes[i + 1] & 0xc0) === 0x80 &&
            (bytes[i + 2] & 0xc0) === 0x80
          ) {
            result += String.fromCharCode(
              ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f),
            )
            i += 3
          } else {
            isValidUtf8 = false
            break
          }
        } else if (b >= 0xf0) {
          if (
            i + 3 < bytes.length &&
            (bytes[i + 1] & 0xc0) === 0x80 &&
            (bytes[i + 2] & 0xc0) === 0x80 &&
            (bytes[i + 3] & 0xc0) === 0x80
          ) {
            const cp =
              ((b & 0x07) << 18) |
              ((bytes[i + 1] & 0x3f) << 12) |
              ((bytes[i + 2] & 0x3f) << 6) |
              (bytes[i + 3] & 0x3f)
            const adj = cp - 0x10000
            result += String.fromCharCode(0xd800 + (adj >> 10), 0xdc00 + (adj & 0x3ff))
            i += 4
          } else {
            isValidUtf8 = false
            break
          }
        } else {
          isValidUtf8 = false
          break
        }
      }
      if (!isValidUtf8) {
        result = ''
        for (let j = start; j < bytes.length; j++) {
          result += String.fromCharCode(bytes[j])
        }
      }
      return result
    }

    function parseCSV(text, delimiter) {
      const rows = []
      let row = []
      let field = ''
      let inQuotes = false
      let i = 0
      while (i < text.length) {
        const ch = text[i]
        if (inQuotes) {
          if (ch === '"') {
            if (i + 1 < text.length && text[i + 1] === '"') {
              field += '"'
              i += 2
            } else {
              inQuotes = false
              i++
            }
          } else {
            field += ch
            i++
          }
        } else {
          if (ch === '"') {
            inQuotes = true
            i++
          } else if (ch === delimiter) {
            row.push(field)
            field = ''
            i++
          } else if (ch === '\r') {
            i++
          } else if (ch === '\n') {
            row.push(field)
            field = ''
            rows.push(row)
            row = []
            i++
          } else {
            field += ch
            i++
          }
        }
      }
      if (field !== '' || row.length > 0) {
        row.push(field)
        rows.push(row)
      }
      return rows
    }

    function removeAccents(str) {
      const accents = 'àáâãäåèéêëìíîïòóôõöùúûüçñÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ'
      const without = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      let result = ''
      for (let k = 0; k < str.length; k++) {
        const idx = accents.indexOf(str[k])
        result += idx >= 0 ? without[idx] : str[k]
      }
      return result
    }

    function normalizeHeader(header) {
      return removeAccents(header.toString().toLowerCase().trim()).replace(/[^a-z0-9]/g, '')
    }

    function matchField(normalized, fnames) {
      for (let i = 0; i < fnames.length; i++) {
        const fn = fnames[i]
        const fnNorm = fn
          .toLowerCase()
          .replace(/_/g, '')
          .replace(/[^a-z0-9]/g, '')
        if (fnNorm === normalized) return fn
      }
      const aliases = {
        pedido: ['pedido', 'ped', 'numero', 'num', 'numped', 'npedido'],
        cliente: ['cliente', 'client', 'nome', 'razao', 'razaosocial', 'nomedocliente'],
        prev_entr: [
          'preventr',
          'prevista',
          'dataentrada',
          'previsaoentrada',
          'preventrada',
          'previstaentrada',
        ],
        tipo_entrega: ['tipoentrega', 'tpentrega', 'tpent', 'tipo', 'tipentrega'],
        cidade: ['cidade', 'city'],
        uf: ['uf', 'estado', 'state'],
        envio_liberacao: ['envioliberacao', 'envio', 'liberacao', 'dataliberacao'],
        transmitir_nfe: ['transmitirnfe', 'nfe', 'transmitir', 'datanfe'],
        prazo_transportadora: ['prazotransportadora', 'prazo', 'prazotransp'],
        status: ['status', 'stat'],
        situacao: ['situacao', 'sit'],
        modal: ['modal', 'mod'],
        destino: ['destino', 'cidade', 'city'],
      }
      for (let i = 0; i < fnames.length; i++) {
        const fn = fnames[i]
        const aliasList = aliases[fn]
        if (!aliasList) continue
        for (let j = 0; j < aliasList.length; j++) {
          if (aliasList[j] === normalized) return fn
        }
      }
      return null
    }

    function pad2(n) {
      return n < 10 ? '0' + n : '' + n
    }

    function formatDateValue(val) {
      if (typeof val === 'object' && val !== null && typeof val.getFullYear === 'function') {
        return val.getFullYear() + '-' + pad2(val.getMonth() + 1) + '-' + pad2(val.getDate())
      }
      if (typeof val === 'string' && val.length > 0) {
        const dmyMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (dmyMatch) {
          return (
            dmyMatch[3] +
            '-' +
            pad2(parseInt(dmyMatch[2], 10)) +
            '-' +
            pad2(parseInt(dmyMatch[1], 10))
          )
        }
        const ymdMatch = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
        if (ymdMatch) {
          return (
            ymdMatch[1] +
            '-' +
            pad2(parseInt(ymdMatch[2], 10)) +
            '-' +
            pad2(parseInt(ymdMatch[3], 10))
          )
        }
      }
      return val
    }

    let text = bytesToString(fileBytes)
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.substring(1)
    }

    const firstLine = text.split('\n')[0]
    let delimiter = ','
    if (firstLine.indexOf(';') >= 0) delimiter = ';'
    else if (firstLine.indexOf('\t') >= 0) delimiter = '\t'

    const rows = parseCSV(text, delimiter)

    if (!rows || rows.length < 2) {
      return e.json(200, {
        success: true,
        collection: collectionName,
        deleted: 0,
        inserted: 0,
        message: 'Nenhum dado encontrado no arquivo',
      })
    }

    const headerRow = rows[0]
    const dataRows = rows.slice(1)

    const filteredRows = []
    for (let r = 0; r < dataRows.length; r++) {
      let isEmpty = true
      for (let c = 0; c < dataRows[r].length; c++) {
        if (
          dataRows[r][c] !== null &&
          dataRows[r][c] !== undefined &&
          dataRows[r][c].toString().trim() !== ''
        ) {
          isEmpty = false
          break
        }
      }
      if (!isEmpty) filteredRows.push(dataRows[r])
    }

    if (filteredRows.length === 0) {
      return e.json(200, {
        success: true,
        collection: collectionName,
        deleted: 0,
        inserted: 0,
        message: 'Nenhum dado encontrado no arquivo',
      })
    }

    const fieldNames = []
    const fields = collection.fields
    for (let i = 0; i < fields.length; i++) {
      fieldNames.push(fields[i].name)
    }

    const headerMap = []
    for (let i = 0; i < headerRow.length; i++) {
      const header = headerRow[i]
      if (!header || header.trim() === '') continue
      const normalized = normalizeHeader(header)
      const matchedField = matchField(normalized, fieldNames)
      if (matchedField) {
        headerMap.push({ col: i, field: matchedField })
      }
    }

    if (headerMap.length === 0) {
      return e.badRequestError('Nenhum cabecalho reconhecido no arquivo CSV')
    }

    let deletedCount = 0
    try {
      deletedCount = $app.countRecords(collectionName)
    } catch (_) {}

    try {
      $app.truncateCollection(collection)
    } catch (_) {
      while (true) {
        let records
        try {
          records = $app.findRecordsByFilter(collectionName, "id != ''", '', 500, 0)
        } catch (_) {
          break
        }
        if (!records || records.length === 0) break
        for (let i = 0; i < records.length; i++) {
          try {
            $app.delete(records[i])
          } catch (_) {}
        }
      }
    }

    let insertedCount = 0
    let errorCount = 0
    for (let i = 0; i < filteredRows.length; i++) {
      try {
        const record = new Record(collection)
        const row = filteredRows[i]
        for (let h = 0; h < headerMap.length; h++) {
          const colIdx = headerMap[h].col
          const fieldName = headerMap[h].field
          if (fieldName === 'id' || fieldName === 'created' || fieldName === 'updated') continue
          let value = row[colIdx]
          if (value !== undefined && value !== null && value !== '') {
            let field = null
            for (let fi = 0; fi < fields.length; fi++) {
              if (fields[fi].name === fieldName) {
                field = fields[fi]
                break
              }
            }
            if (field && field.type === 'date') {
              value = formatDateValue(value)
            }
            if (field && field.type === 'number') {
              const numVal = parseFloat(value.toString().replace(',', '.'))
              value = isNaN(numVal) ? 0 : numVal
            }
            record.set(fieldName, value)
          }
        }
        $app.save(record)
        insertedCount++
      } catch (err) {
        errorCount++
      }
    }

    return e.json(200, {
      success: true,
      collection: collectionName,
      deleted: deletedCount,
      inserted: insertedCount,
      message:
        errorCount > 0
          ? insertedCount + ' registros importados, ' + errorCount + ' erros'
          : insertedCount + ' registros importados com sucesso',
    })
  },
  $apis.requireAuth(),
)
