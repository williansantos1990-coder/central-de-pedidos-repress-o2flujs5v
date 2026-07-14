routerAdd(
  'POST',
  '/backend/v1/import',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('auth required')

    var collectionsConfig = [
      { name: 'pedve012', field: 'pedve012', sheet: 'PEDVE012', label: 'PEDVE012' },
      { name: 'pedve005', field: 'pedve005', sheet: 'PEDVE005', label: 'PEDVE005' },
      {
        name: 'transportadoras',
        field: 'transportadoras',
        sheet: 'Transportadoras',
        label: 'Transportadoras',
      },
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

    function subarray(data, start, end) {
      var result = []
      for (var i = start; i < end && i < data.length; i++) {
        result.push(data[i])
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
        prazo_transportadora: ['prazo'],
        prazo_transp_desc: ['prazotransportadora', 'prazotranspdesc', 'prazotransp'],
        prazo_entrega: ['prazoentrega', 'prazodeentrega'],
        padrao_exceda: ['padraoexceda', 'padraodoexceda', 'exceda', 'padrao'],
        transportadora: ['transportadora', 'transp', 'carrier'],
        status: ['status', 'stat'],
        situacao: ['situacao', 'sit'],
        modal: ['modal', 'mod'],
        destino: ['destino'],
      }
      for (var i = 0; i < fnames.length; i++) {
        var fn = fnames[i]
        var aliasList = aliases[fn]
        if (!aliasList) continue
        for (var j = 0; j < aliasList.length; j++) {
          if (aliasList[j] === normalized) return fn
        }
      }
      for (var i = 0; i < fnames.length; i++) {
        var fn = fnames[i]
        var fnNorm = fn
          .toLowerCase()
          .replace(/_/g, '')
          .replace(/[^a-z0-9]/g, '')
        if (fnNorm === normalized) return fn
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
      if (typeof val !== 'string' || val.length === 0) return null
      var trimmed = val.trim()

      var serialMatch = trimmed.match(/^(\d+(\.\d+)?)$/)
      if (serialMatch) {
        var serial = parseFloat(serialMatch[1])
        if (serial > 1 && serial < 60000) {
          try {
            var serialDateObj = new Date(Math.round((serial - 25569) * 86400 * 1000))
            return (
              serialDateObj.getUTCFullYear() +
              '-' +
              pad2(serialDateObj.getUTCMonth() + 1) +
              '-' +
              pad2(serialDateObj.getUTCDate())
            )
          } catch (sde) {}
        }
      }

      var dmyMatch = trimmed.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
      )
      if (dmyMatch) {
        return (
          dmyMatch[3] +
          '-' +
          pad2(parseInt(dmyMatch[2], 10)) +
          '-' +
          pad2(parseInt(dmyMatch[1], 10))
        )
      }

      var ymdMatch = trimmed.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
      )
      if (ymdMatch) {
        return (
          ymdMatch[1] +
          '-' +
          pad2(parseInt(ymdMatch[2], 10)) +
          '-' +
          pad2(parseInt(ymdMatch[3], 10))
        )
      }

      var dmyDashMatch = trimmed.match(
        /^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
      )
      if (dmyDashMatch) {
        return (
          dmyDashMatch[3] +
          '-' +
          pad2(parseInt(dmyDashMatch[2], 10)) +
          '-' +
          pad2(parseInt(dmyDashMatch[1], 10))
        )
      }

      return null
    }

    function decodeXmlEntities(str) {
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, function (_, code) {
          return String.fromCharCode(parseInt(code, 10))
        })
        .replace(/&#x([0-9a-fA-F]+);/g, function (_, code) {
          return String.fromCharCode(parseInt(code, 16))
        })
    }

    function inflateData(src) {
      var dst = []
      var si = 0
      var bitBuf = 0
      var bitCnt = 0

      function bits(n) {
        while (bitCnt < n) {
          bitBuf |= src[si++] << bitCnt
          bitCnt += 8
        }
        var v = bitBuf & ((1 << n) - 1)
        bitBuf >>>= n
        bitCnt -= n
        return v
      }

      function buildTable(lengths) {
        var maxLen = 0
        for (var i = 0; i < lengths.length; i++) {
          if (lengths[i] > maxLen) maxLen = lengths[i]
        }
        var blCount = []
        for (var i = 0; i <= maxLen; i++) blCount.push(0)
        for (var i = 0; i < lengths.length; i++) {
          if (lengths[i] > 0) blCount[lengths[i]]++
        }
        var nextCode = [0]
        var code = 0
        for (var i = 1; i <= maxLen; i++) {
          code = (code + blCount[i - 1]) << 1
          nextCode.push(code)
        }
        var table = {}
        for (var i = 0; i < lengths.length; i++) {
          if (lengths[i] > 0) {
            var c = nextCode[lengths[i]]++
            table[lengths[i] * 65536 + c] = i
          }
        }
        return { table: table, maxLen: maxLen }
      }

      function decode(t) {
        var code = 0
        for (var len = 1; len <= t.maxLen; len++) {
          code = (code << 1) | bits(1)
          if (t.table[len * 65536 + code] !== undefined) return t.table[len * 65536 + code]
        }
        return -1
      }

      var lenBase = [
        3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115,
        131, 163, 195, 227, 258,
      ]
      var lenExtra = [
        0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
      ]
      var distBase = [
        1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537,
        2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
      ]
      var distExtra = [
        0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12,
        13, 13,
      ]

      var fixedLit = []
      for (var i = 0; i < 288; i++) {
        if (i < 144) fixedLit.push(8)
        else if (i < 256) fixedLit.push(9)
        else if (i < 280) fixedLit.push(7)
        else fixedLit.push(8)
      }
      var fixedDist = []
      for (var i = 0; i < 30; i++) fixedDist.push(5)

      function decompressBlock(lt, dt) {
        while (true) {
          var sym = decode(lt)
          if (sym < 256) {
            dst.push(sym)
          } else if (sym === 256) {
            break
          } else {
            var li = sym - 257
            var length = lenBase[li] + bits(lenExtra[li])
            var dsym = decode(dt)
            var dist = distBase[dsym] + bits(distExtra[dsym])
            var startIdx = dst.length - dist
            for (var i = 0; i < length; i++) {
              dst.push(dst[startIdx + i])
            }
          }
        }
      }

      var last = false
      while (!last) {
        last = bits(1) === 1
        var type = bits(2)

        if (type === 0) {
          bitBuf = 0
          bitCnt = 0
          var len = src[si] | (src[si + 1] << 8)
          si += 4
          for (var i = 0; i < len; i++) {
            dst.push(src[si++])
          }
        } else if (type === 1) {
          decompressBlock(buildTable(fixedLit), buildTable(fixedDist))
        } else if (type === 2) {
          var hlit = bits(5) + 257
          var hdist = bits(5) + 1
          var hclen = bits(4) + 4
          var clOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
          var clLengths = []
          for (var i = 0; i < 19; i++) clLengths.push(0)
          for (var i = 0; i < hclen; i++) {
            clLengths[clOrder[i]] = bits(3)
          }
          var clTree = buildTable(clLengths)

          var allLengths = []
          while (allLengths.length < hlit + hdist) {
            var sym = decode(clTree)
            if (sym < 16) {
              allLengths.push(sym)
            } else if (sym === 16) {
              var rep = bits(2) + 3
              var prev = allLengths[allLengths.length - 1]
              for (var i = 0; i < rep; i++) allLengths.push(prev)
            } else if (sym === 17) {
              var rep = bits(3) + 3
              for (var i = 0; i < rep; i++) allLengths.push(0)
            } else if (sym === 18) {
              var rep = bits(7) + 11
              for (var i = 0; i < rep; i++) allLengths.push(0)
            }
          }

          var litLengths = allLengths.slice(0, hlit)
          var distLengths = allLengths.slice(hlit)
          decompressBlock(buildTable(litLengths), buildTable(distLengths))
        }
      }

      return dst
    }

    function parseZipEntries(data) {
      var files = {}
      var eocd = -1
      for (var i = data.length - 22; i >= 0; i--) {
        if (
          data[i] === 0x50 &&
          data[i + 1] === 0x4b &&
          data[i + 2] === 0x05 &&
          data[i + 3] === 0x06
        ) {
          eocd = i
          break
        }
      }
      if (eocd === -1) return null

      var cdOffset =
        data[eocd + 16] | (data[eocd + 17] << 8) | (data[eocd + 18] << 16) | (data[eocd + 19] << 24)
      var cdEntries = data[eocd + 10] | (data[eocd + 11] << 8)

      var pos = cdOffset
      for (var i = 0; i < cdEntries; i++) {
        if (
          data[pos] !== 0x50 ||
          data[pos + 1] !== 0x4b ||
          data[pos + 2] !== 0x01 ||
          data[pos + 3] !== 0x02
        )
          break

        var compMethod = data[pos + 10] | (data[pos + 11] << 8)
        var compSize =
          data[pos + 20] | (data[pos + 21] << 8) | (data[pos + 22] << 16) | (data[pos + 23] << 24)
        var nameLen = data[pos + 28] | (data[pos + 29] << 8)
        var extraLen = data[pos + 30] | (data[pos + 31] << 8)
        var commentLen = data[pos + 32] | (data[pos + 33] << 8)
        var localOffset =
          data[pos + 42] | (data[pos + 43] << 8) | (data[pos + 44] << 16) | (data[pos + 45] << 24)

        var name = ''
        for (var j = 0; j < nameLen; j++) {
          name += String.fromCharCode(data[pos + 46 + j])
        }

        var lfh = localOffset
        var localNameLen = data[lfh + 26] | (data[lfh + 27] << 8)
        var localExtraLen = data[lfh + 28] | (data[lfh + 29] << 8)
        var dataOffset = lfh + 30 + localNameLen + localExtraLen

        var fileData = null
        if (compMethod === 0) {
          fileData = subarray(data, dataOffset, dataOffset + compSize)
        } else if (compMethod === 8) {
          var compData = subarray(data, dataOffset, dataOffset + compSize)
          try {
            fileData = inflateData(compData)
          } catch (err) {
            fileData = null
          }
        }

        if (fileData) {
          files[name] = fileData
        }

        pos += 46 + nameLen + extraLen + commentLen
      }

      return files
    }

    function extractSharedStrings(xmlStr) {
      var strings = []
      var siRegex = /<si[^>]*>([\s\S]*?)<\/si>/g
      var match
      while ((match = siRegex.exec(xmlStr)) !== null) {
        var siContent = match[1]
        var text = ''
        var tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g
        var tMatch
        while ((tMatch = tRegex.exec(siContent)) !== null) {
          text += decodeXmlEntities(tMatch[1])
        }
        strings.push(text)
      }
      return strings
    }

    function getSheetFileMap(zipFiles) {
      var sheetMap = {}
      var wbXml = null
      var relsXml = null

      for (var name in zipFiles) {
        if (name === 'xl/workbook.xml') wbXml = bytesToString(zipFiles[name])
        if (name === 'xl/_rels/workbook.xml.rels') relsXml = bytesToString(zipFiles[name])
      }

      if (wbXml && relsXml) {
        var rels = {}
        var relRegex = /<Relationship\b[^>]*\/?>/g
        var relMatch
        while ((relMatch = relRegex.exec(relsXml)) !== null) {
          var relTag = relMatch[0]
          var idMatch = relTag.match(/Id="([^"]+)"/)
          var targetMatch = relTag.match(/Target="([^"]+)"/)
          if (idMatch && targetMatch) {
            var target = decodeXmlEntities(targetMatch[1])
            if (target.charAt(0) === '/') {
              target = target.substring(1)
            } else if (target.indexOf('xl/') !== 0) {
              target = 'xl/' + target
            }
            rels[idMatch[1]] = target
          }
        }

        var sheetRegex = /<sheet\b[^>]*\/?>/g
        var sheetMatch
        while ((sheetMatch = sheetRegex.exec(wbXml)) !== null) {
          var sheetTag = sheetMatch[0]
          var nameMatch = sheetTag.match(/name="([^"]+)"/)
          var rIdMatch = sheetTag.match(/r:id="([^"]+)"/) || sheetTag.match(/\sId="([^"]+)"/)
          if (nameMatch && rIdMatch && rels[rIdMatch[1]]) {
            sheetMap[decodeXmlEntities(nameMatch[1]).toLowerCase()] = rels[rIdMatch[1]]
          }
        }
      }

      return sheetMap
    }

    function parseWorksheet(xmlStr, sharedStrings) {
      var rows = []
      var rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g
      var rowMatch
      while ((rowMatch = rowRegex.exec(xmlStr)) !== null) {
        var rowContent = rowMatch[1]
        var cells = []
        var cRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g
        var cMatch
        while ((cMatch = cRegex.exec(rowContent)) !== null) {
          var attrs = cMatch[1] || cMatch[3] || ''
          var content = cMatch[2] || ''

          var rMatch = attrs.match(/r="([A-Z]+)\d+"/)
          var colIdx = 0
          if (rMatch) {
            var colLetters = rMatch[1]
            for (var ci = 0; ci < colLetters.length; ci++) {
              colIdx = colIdx * 26 + (colLetters.charCodeAt(ci) - 64)
            }
            colIdx--
          }

          var tMatch = attrs.match(/t="([^"]+)"/)
          var type = tMatch ? tMatch[1] : 'n'

          var value = ''
          if (type === 's') {
            var vMatch = content.match(/<v[^>]*>([\s\S]*?)<\/v>/)
            if (vMatch) {
              var idx = parseInt(vMatch[1], 10)
              value = sharedStrings[idx] || ''
            }
          } else if (type === 'str' || type === 'inlineStr') {
            var tContent = content.match(/<t[^>]*>([\s\S]*?)<\/t>/)
            if (tContent) {
              value = decodeXmlEntities(tContent[1])
            }
          } else {
            var vMatch2 = content.match(/<v[^>]*>([\s\S]*?)<\/v>/)
            if (vMatch2) {
              value = vMatch2[1]
            }
          }

          while (cells.length <= colIdx) cells.push('')
          cells[colIdx] = value
        }

        if (cells.length > 0) {
          rows.push(cells)
        }
      }
      return rows
    }

    function parseXlsx(fileBytes, config) {
      var zipFiles = parseZipEntries(fileBytes)
      if (!zipFiles) return { error: 'Formato XLSX invalido' }

      var sharedStrings = []
      for (var name in zipFiles) {
        if (name === 'xl/sharedStrings.xml') {
          sharedStrings = extractSharedStrings(bytesToString(zipFiles[name]))
          break
        }
      }

      var sheetMap = getSheetFileMap(zipFiles)
      var sheetFile = null
      var sheetNameUsed = null

      if (config.sheet) {
        sheetFile = sheetMap[config.sheet.toLowerCase()]
        if (!sheetFile) {
          var available = []
          for (var sn in sheetMap) available.push(sn)
          return {
            error:
              'Planilha "' +
              config.sheet +
              '" nao encontrada no arquivo ' +
              config.label +
              '. Abas disponiveis: ' +
              available.join(', '),
          }
        }
        sheetNameUsed = config.sheet
      } else {
        for (var name in zipFiles) {
          if (name.match(/^xl\/worksheets\/sheet\d+\.xml$/)) {
            sheetFile = name
            break
          }
        }
        if (!sheetFile) {
          return { error: 'Nenhuma aba encontrada no arquivo ' + config.label }
        }
        sheetNameUsed = sheetFile
      }

      var sheetData = zipFiles[sheetFile]
      if (!sheetData) {
        return { error: 'Arquivo da planilha nao encontrado: ' + sheetFile }
      }

      var sheetXml = bytesToString(sheetData)
      var rows = parseWorksheet(sheetXml, sharedStrings)

      if (!rows || rows.length < 2) {
        return {
          error: 'Nenhum dado encontrado na aba "' + sheetNameUsed + '" do arquivo ' + config.label,
        }
      }

      return { headerRow: rows[0], dataRows: rows.slice(1) }
    }

    var parsed = []

    for (var pi = 0; pi < pendingFiles.length; pi++) {
      var item = pendingFiles[pi]
      var config = item.config
      var uploadedFile = item.file

      var fileBytes = null

      // Method 1: .bytes() — goja may return []byte as Uint8Array or as a
      // string depending on runtime version; handle both.
      try {
        var rawBytes = uploadedFile.bytes()
        if (rawBytes !== null && rawBytes !== undefined && rawBytes.length > 0) {
          fileBytes = []
          if (typeof rawBytes === 'string') {
            for (var bi = 0; bi < rawBytes.length; bi++) {
              fileBytes.push(rawBytes.charCodeAt(bi) & 0xff)
            }
          } else {
            for (var bi = 0; bi < rawBytes.length; bi++) {
              fileBytes.push(rawBytes[bi] & 0xff)
            }
          }
        }
      } catch (be) {}

      // Method 2: .open() returns a reader (multipart.File) that
      // implements io.Reader — read in chunks.
      if (!fileBytes || fileBytes.length === 0) {
        try {
          var reader = uploadedFile.open()
          if (reader) {
            var allBytes = []
            var buf = new Uint8Array(8192)
            while (true) {
              var n
              try {
                n = reader.read(buf)
              } catch (readErr) {
                break
              }
              if (n === null || n === undefined || n <= 0) break
              for (var bi = 0; bi < n; bi++) allBytes.push(buf[bi])
            }
            try {
              reader.close()
            } catch (ce) {}
            if (allBytes.length > 0) fileBytes = allBytes
          }
        } catch (openErr) {}
      }

      // Method 3: .read() directly on the file object (some PB versions
      // expose Read() on filesystem.File itself).
      if (!fileBytes || fileBytes.length === 0) {
        try {
          var allBytes2 = []
          var buf2 = new Uint8Array(8192)
          while (true) {
            var n2
            try {
              n2 = uploadedFile.read(buf2)
            } catch (readErr2) {
              break
            }
            if (n2 === null || n2 === undefined || n2 <= 0) break
            for (var bi2 = 0; bi2 < n2; bi2++) allBytes2.push(buf2[bi2])
          }
          try {
            uploadedFile.close()
          } catch (ce2) {}
          if (allBytes2.length > 0) fileBytes = allBytes2
        } catch (directErr) {}
      }

      if (!fileBytes || fileBytes.length === 0) {
        return e.badRequestError('Arquivo vazio: ' + config.label)
      }

      var isXlsx = fileBytes.length >= 2 && fileBytes[0] === 0x50 && fileBytes[1] === 0x4b

      var headerRow = null
      var dataRows = null

      if (isXlsx) {
        var xlsxResult = parseXlsx(fileBytes, config)
        if (xlsxResult.error) {
          return e.badRequestError(xlsxResult.error)
        }
        headerRow = xlsxResult.headerRow
        dataRows = xlsxResult.dataRows
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

    var dateValidationErrors = []
    for (var dvi = 0; dvi < parsed.length; dvi++) {
      var dvp = parsed[dvi]
      for (var dvr = 0; dvr < dvp.filteredRows.length; dvr++) {
        var dvrow = dvp.filteredRows[dvr]
        for (var dvhm = 0; dvhm < dvp.headerMap.length; dvhm++) {
          var dvColIdx = dvp.headerMap[dvhm].col
          var dvFieldName = dvp.headerMap[dvhm].field
          if (dvFieldName === 'id' || dvFieldName === 'created' || dvFieldName === 'updated')
            continue
          var dvValue = dvrow[dvColIdx]
          if (dvValue === undefined || dvValue === null || dvValue === '') continue
          var dvField = null
          for (var dvfi = 0; dvfi < dvp.fields.length; dvfi++) {
            if (dvp.fields[dvfi].name === dvFieldName) {
              dvField = dvp.fields[dvfi]
              break
            }
          }
          if (dvField && dvField.type === 'date') {
            var dvFormatted = formatDateValue(dvValue)
            if (dvFormatted === null) {
              dateValidationErrors.push(
                dvp.config.label +
                  ' - Linha ' +
                  (dvr + 2) +
                  ', coluna "' +
                  dvFieldName +
                  '": valor "' +
                  dvValue.toString().substring(0, 50) +
                  '" nao reconhecido como data',
              )
            }
          }
        }
      }
    }
    if (dateValidationErrors.length > 0) {
      return e.badRequestError('Erros de validacao de data:\n' + dateValidationErrors.join('\n'))
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
                if (value === null) continue
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
