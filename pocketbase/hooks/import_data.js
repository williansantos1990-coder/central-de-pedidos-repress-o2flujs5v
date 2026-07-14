// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/import',
  (e) => {
    const XLSX = require('xlsx')

    const userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('auth required')

    var collectionsConfig = [
      { name: 'pedve012', field: 'pedve012', sheet: 'PEDVE012', label: 'PEDVE012' },
      { name: 'pedve005', field: 'pedve005', sheet: 'PEDVE005', label: 'PEDVE005' },
      { name: 'transportadoras', field: 'transportadoras', sheet: null, label: 'Transportadoras' },
    ]

    var pendingFiles = []
    for (var i = 0; i < collectionsConfig.length; i++) {
      var cfg = collectionsConfig[i]
      var uploaded = e.findUploadedFiles(cfg.field)
      if (uploaded && uploaded.length > 0) {
        pendingFiles.push({ config: cfg, file: uploaded[0] })
      }
    }

    if (pendingFiles.length === 0) {
      return e.badRequestError('Nenhum arquivo enviado')
    }

    function bytesToBinary(bytes) {
      var result = ''
      for (var i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i])
      }
      return result
    }

    function bytesToString(bytes) {
      var hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
      var start = hasBom ? 3 : 0
      var result = ''
      var i = start
      var isValidUtf8 = true
      while (i < bytes.length) {
        var b = bytes[i]
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
            var cp =
              ((b & 0x07) << 18) |
              ((bytes[i + 1] & 0x3f) << 12) |
              ((bytes[i + 2] & 0x3f) << 6) |
              (bytes[i + 3] & 0x3f)
            var adj = cp - 0x10000
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
        for (var j = start; j < bytes.length; j++) {
          result += String.fromCharCode(bytes[j])
        }
      }
      return result
    }

    function parseCSV(text, delimiter) {
      var rows = []
      var row = []
      var field = ''
      var inQuotes = false
      var i = 0
      while (i < text.length) {
        var ch = text[i]
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
      var accents = 'àáâãäåèéêëìíîïòóôõöùúûüçñÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇÑ'
      var without = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      var result = ''
      for (var k = 0; k < str.length; k++) {
        var idx = accents.indexOf(str[k])
        result += idx >= 0 ? without[idx] : str[k]
      }
      return result
    }

    function normalizeHeader(header) {
      return removeAccents(header.toString().toLowerCase().trim()).replace(/[^a-z0-9]/g, '')
    }

    function matchField(normalized, fnames) {
      for (var i = 0; i < fnames.length; i++) {
        var fn = fnames[i]
        var fnNorm = fn
          .toLowerCase()
          .replace(/_/g, '')
          .replace(/[^a-z0-9]/g, '')
        if (fnNorm === normalized) return fn
      }
      var aliases = {
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
      for (var i = 0; i < fnames.length; i++) {
        var fn = fnames[i]
        var aliasList = aliases[fn]
        if (!aliasList) continue
        for (var j = 0; j < aliasList.length; j++) {
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
        var dmyMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (dmyMatch) {
          return (
            dmyMatch[3] +
            '-' +
            pad2(parseInt(dmyMatch[2], 10)) +
            '-' +
            pad2(parseInt(dmyMatch[1], 10))
          )
        }
        var ymdMatch = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
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

    var parsed = []

    for (var pi = 0; pi < pendingFiles.length; pi++) {
      var item = pendingFiles[pi]
      var config = item.config
      var uploadedFile = item.file

      var fileBytes
      try {
        fileBytes = uploadedFile.Bytes()
      } catch (err) {
        return e.badRequestError('Erro ao ler arquivo: ' + config.label)
      }

      if (!fileBytes || fileBytes.length === 0) {
        return e.badRequestError('Arquivo vazio: ' + config.label)
      }

      var isXlsx = fileBytes.length >= 2 && fileBytes[0] === 0x50 && fileBytes[1] === 0x4b

      var headerRow = null
      var dataRows = null

      if (isXlsx) {
        var binary = bytesToBinary(fileBytes)
        var wb
        try {
          wb = XLSX.read(binary, { type: 'binary' })
        } catch (err) {
          return e.badRequestError(
            'Erro ao ler arquivo XLSX: ' + config.label + ' - ' + (err.message || ''),
          )
        }

        var sheetName = config.sheet
        var sheet = null

        if (sheetName) {
          sheet = wb.Sheets[sheetName]
          if (!sheet) {
            for (var si = 0; si < wb.SheetNames.length; si++) {
              if (wb.SheetNames[si].toUpperCase() === sheetName.toUpperCase()) {
                sheet = wb.Sheets[wb.SheetNames[si]]
                break
              }
            }
          }
          if (!sheet) {
            return e.badRequestError(
              'Planilha "' +
                config.sheet +
                '" nao encontrada no arquivo ' +
                config.label +
                '. Abas disponiveis: ' +
                wb.SheetNames.join(', '),
            )
          }
        } else {
          if (!wb.SheetNames || wb.SheetNames.length === 0) {
            return e.badRequestError('Nenhuma aba encontrada no arquivo ' + config.label)
          }
          sheetName = wb.SheetNames[0]
          sheet = wb.Sheets[sheetName]
        }

        var xlsxRows
        try {
          xlsxRows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: false,
            defval: '',
          })
        } catch (err) {
          return e.badRequestError('Erro ao processar aba "' + sheetName + '": ' + config.label)
        }

        if (!xlsxRows || xlsxRows.length < 2) {
          return e.badRequestError(
            'Nenhum dado encontrado na aba "' + sheetName + '" do arquivo ' + config.label,
          )
        }

        headerRow = xlsxRows[0]
        dataRows = xlsxRows.slice(1)
      } else {
        var text = bytesToString(fileBytes)
        if (text.charCodeAt(0) === 0xfeff) {
          text = text.substring(1)
        }

        var firstLine = text.split('\n')[0]
        var delimiter = ','
        if (firstLine.indexOf(';') >= 0) delimiter = ';'
        else if (firstLine.indexOf('\t') >= 0) delimiter = '\t'

        var csvRows = parseCSV(text, delimiter)

        if (!csvRows || csvRows.length < 2) {
          return e.badRequestError('Nenhum dado encontrado no arquivo ' + config.label)
        }

        headerRow = csvRows[0]
        dataRows = csvRows.slice(1)
      }

      var filteredRows = []
      for (var r = 0; r < dataRows.length; r++) {
        var isEmpty = true
        for (var c = 0; c < dataRows[r].length; c++) {
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
        return e.badRequestError('Nenhum dado valido encontrado no arquivo ' + config.label)
      }

      var collection
      try {
        collection = $app.findCollectionByNameOrId(config.name)
      } catch (_) {
        return e.badRequestError('Colecao nao encontrada: ' + config.name)
      }

      var fieldNames = []
      var fields = collection.fields
      for (var fi = 0; fi < fields.length; fi++) {
        fieldNames.push(fields[fi].name)
      }

      var headerMap = []
      for (var h = 0; h < headerRow.length; h++) {
        var header = headerRow[h]
        if (!header || header.toString().trim() === '') continue
        var normalized = normalizeHeader(header.toString())
        var matchedField = matchField(normalized, fieldNames)
        if (matchedField) {
          headerMap.push({ col: h, field: matchedField })
        }
      }

      if (headerMap.length === 0) {
        return e.badRequestError('Nenhum cabecalho reconhecido no arquivo ' + config.label)
      }

      parsed.push({
        config: config,
        collection: collection,
        fields: fields,
        headerMap: headerMap,
        filteredRows: filteredRows,
      })
    }

    var results = []

    for (var ri = 0; ri < parsed.length; ri++) {
      var p = parsed[ri]
      var collectionName = p.config.name

      var deletedCount = 0
      try {
        deletedCount = $app.countRecords(collectionName)
      } catch (_) {}

      try {
        $app.truncateCollection(p.collection)
      } catch (_) {
        while (true) {
          var records
          try {
            records = $app.findRecordsByFilter(collectionName, "id != ''", '', 500, 0)
          } catch (_) {
            break
          }
          if (!records || records.length === 0) break
          for (var di = 0; di < records.length; di++) {
            try {
              $app.delete(records[di])
            } catch (_) {}
          }
        }
      }

      var insertedCount = 0
      var errorCount = 0
      for (var ins = 0; ins < p.filteredRows.length; ins++) {
        try {
          var record = new Record(p.collection)
          var row = p.filteredRows[ins]
          for (var hm = 0; hm < p.headerMap.length; hm++) {
            var colIdx = p.headerMap[hm].col
            var fieldName = p.headerMap[hm].field
            if (fieldName === 'id' || fieldName === 'created' || fieldName === 'updated') continue
            var value = row[colIdx]
            if (value !== undefined && value !== null && value !== '') {
              var field = null
              for (var ffi = 0; ffi < p.fields.length; ffi++) {
                if (p.fields[ffi].name === fieldName) {
                  field = p.fields[ffi]
                  break
                }
              }
              if (field && field.type === 'date') {
                value = formatDateValue(value)
              }
              if (field && field.type === 'number') {
                var numVal = parseFloat(value.toString().replace(',', '.'))
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

      results.push({
        collection: collectionName,
        label: p.config.label,
        deleted: deletedCount,
        inserted: insertedCount,
        errors: errorCount,
        message:
          errorCount > 0
            ? insertedCount + ' registros importados, ' + errorCount + ' erros'
            : insertedCount + ' registros importados com sucesso',
      })
    }

    return e.json(200, {
      success: true,
      results: results,
      message: 'Finalizado!',
    })
  },
  $apis.requireAuth(),
)
