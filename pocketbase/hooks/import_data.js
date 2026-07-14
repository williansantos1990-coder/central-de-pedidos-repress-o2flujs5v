// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/import/{collection}',
  (e) => {
    const XLSX = require('xlsx')

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

    let workbook
    try {
      workbook = XLSX.read(fileBytes, { type: 'array', cellDates: true })
    } catch (err) {
      return e.badRequestError('Erro ao processar Excel: ' + (err.message || ''))
    }

    let sheetName = null
    if (collectionName === 'pedve005') {
      for (let i = 0; i < workbook.SheetNames.length; i++) {
        if (workbook.SheetNames[i].trim().toUpperCase() === 'PEDVE005') {
          sheetName = workbook.SheetNames[i]
          break
        }
      }
      if (!sheetName) {
        return e.badRequestError('Aba "PEDVE005" nao encontrada no arquivo')
      }
    } else {
      sheetName = workbook.SheetNames[0]
    }

    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: true,
      blankrows: false,
    })

    if (!rows || rows.length === 0) {
      return e.json(200, {
        success: true,
        collection: collectionName,
        deleted: 0,
        inserted: 0,
        message: 'Nenhum dado encontrado na planilha',
      })
    }

    const fieldNames = []
    const fields = collection.fields
    for (let i = 0; i < fields.length; i++) {
      fieldNames.push(fields[i].name)
    }

    function removeAccents(str) {
      const accents = 'àáâãäåèéêëìíîïòóôõöùúûüçñÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ'
      const without = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      let result = ''
      for (let i = 0; i < str.length; i++) {
        const idx = accents.indexOf(str[i])
        result += idx >= 0 ? without[idx] : str[i]
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

    const headerMap = {}
    const excelHeaders = Object.keys(rows[0])
    for (let i = 0; i < excelHeaders.length; i++) {
      const header = excelHeaders[i]
      const normalized = normalizeHeader(header)
      const matchedField = matchField(normalized, fieldNames)
      if (matchedField) {
        headerMap[header] = matchedField
      }
    }

    if (Object.keys(headerMap).length === 0) {
      return e.badRequestError('Nenhum cabecalho reconhecido no arquivo Excel')
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
    for (let i = 0; i < rows.length; i++) {
      try {
        const record = new Record(collection)
        const row = rows[i]
        for (const header in headerMap) {
          if (!Object.prototype.hasOwnProperty.call(headerMap, header)) continue
          const fieldName = headerMap[header]
          if (fieldName === 'id' || fieldName === 'created' || fieldName === 'updated') continue
          let value = row[header]
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
