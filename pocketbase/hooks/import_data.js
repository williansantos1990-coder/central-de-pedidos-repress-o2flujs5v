// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/import/{collection}',
  (e) => {
    try {
      const collectionName = e.request.pathValue('collection')
      const validCollections = ['pedve005', 'pedve012', 'transportadoras']
      if (validCollections.indexOf(collectionName) < 0) {
        return e.badRequestError('Coleção inválida: ' + collectionName)
      }

      const body = e.requestInfo().body || {}
      const b64 = body.file || ''
      if (!b64) return e.badRequestError('Nenhum arquivo enviado')

      const clean = b64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '')
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const bytes = []
      for (let i = 0; i < clean.length; i += 4) {
        const c0 = chars.indexOf(clean.charAt(i))
        const c1 = chars.indexOf(clean.charAt(i + 1))
        const c2 = i + 2 < clean.length ? chars.indexOf(clean.charAt(i + 2)) : -1
        const c3 = i + 3 < clean.length ? chars.indexOf(clean.charAt(i + 3)) : -1
        if (c0 < 0 || c1 < 0) break
        bytes.push((c0 << 2) | (c1 >> 4))
        if (c2 >= 0) bytes.push(((c1 & 15) << 4) | (c2 >> 2))
        if (c3 >= 0) bytes.push(((c2 & 3) << 6) | c3)
      }

      const XLSX = require('xlsx')
      const wb = XLSX.read(new Uint8Array(bytes), { type: 'array' })
      const sheetName = wb.SheetNames[0]
      if (!sheetName) return e.badRequestError('Planilha sem abas')
      const sheet = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      if (rows.length === 0) return e.badRequestError('Planilha vazia ou sem dados')

      const fieldMaps = {
        pedve012: {
          pedido: ['pedido', 'Pedido', 'PEDIDO'],
          cliente: ['cliente', 'Cliente', 'CLIENTE'],
          envio_liberacao: [
            'envio_liberacao',
            'envio liberacao',
            'Envio Liberação',
            'ENVIO LIBERAÇÃO',
            'Envio Liberacao',
          ],
          prev_entr: [
            'prev_entr',
            'prev.entr',
            'Prev.Entr',
            'PREV.ENTR',
            'Prev Entr',
            'Previsao Entrega',
          ],
          transmitir_nfe: [
            'transmitir_nfe',
            'transmitir nfe',
            'Transmitir NFe',
            'TRANSMITIR NFE',
            'Transmitir Nfe',
          ],
          tipo_entrega: [
            'tipo_entrega',
            'tipo entrega',
            'Tipo Entrega',
            'TIPO ENTREGA',
            'Tp. Entrega',
            'TP. ENTREGA',
          ],
          cidade: ['cidade', 'Cidade', 'CIDADE'],
          uf: ['uf', 'UF'],
          prazo_transportadora: [
            'prazo_transportadora',
            'prazo transportadora',
            'Prazo Transportadora',
            'PRAZO TRANSPORTADORA',
            'Prazo Transp.',
          ],
          status: ['status', 'Status', 'STATUS'],
          situacao: ['situacao', 'Situação', 'SITUACAO', 'Situacao', 'SITUAÇÃO'],
        },
        pedve005: {
          pedido: ['pedido', 'Pedido', 'PEDIDO'],
          cliente: ['cliente', 'Cliente', 'CLIENTE'],
          prev_entr: ['prev_entr', 'prev.entr', 'Prev.Entr', 'PREV.ENTR', 'Prev Entr'],
          tipo_entrega: [
            'tipo_entrega',
            'tipo entrega',
            'Tipo Entrega',
            'TIPO ENTREGA',
            'Tp. Entrega',
          ],
          cidade: ['cidade', 'Cidade', 'CIDADE'],
          uf: ['uf', 'UF'],
        },
        transportadoras: {
          destino: ['destino', 'DESTINO', 'Destino', 'cidade', 'Cidade', 'CIDADE'],
          uf: ['uf', 'UF'],
          prazo_transportadora: [
            'prazo_transportadora',
            'prazo transportadora',
            'PRAZO TRANSPORTADORA',
            'Prazo Transportadora',
            'Prazo Transp.',
          ],
          modal: ['modal', 'MODAL', 'Modal'],
        },
      }

      const fieldMap = fieldMaps[collectionName]
      const col = $app.findCollectionByNameOrId(collectionName)

      let deleted = 0
      let hasMore = true
      while (hasMore) {
        const records = $app.findRecordsByFilter(collectionName, "id != ''", '', 500, 0)
        if (records.length === 0) {
          hasMore = false
        } else {
          for (let i = 0; i < records.length; i++) {
            $app.delete(records[i])
            deleted++
          }
        }
      }

      let inserted = 0
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r]
        const record = new Record(col)
        let hasAnyValue = false
        for (const fieldName in fieldMap) {
          const possibleNames = fieldMap[fieldName]
          let found = false
          for (let n = 0; n < possibleNames.length; n++) {
            const targetLower = possibleNames[n].toLowerCase()
            for (const key in row) {
              if (key.toLowerCase().trim() === targetLower) {
                const val = row[key]
                if (val !== '' && val != null) {
                  hasAnyValue = true
                  if (fieldName === 'prazo_transportadora') {
                    const num = parseInt(String(val).replace(/\D/g, ''), 10)
                    if (!isNaN(num)) record.set(fieldName, num)
                  } else {
                    record.set(fieldName, String(val).trim())
                  }
                }
                found = true
                break
              }
            }
            if (found) break
          }
        }
        if (collectionName === 'pedve012' || collectionName === 'pedve005') {
          if (!record.getString('pedido')) record.set('pedido', 'AUTO_' + (inserted + 1))
        }
        if (collectionName === 'transportadoras' && !record.getString('destino')) {
          continue
        }
        $app.save(record)
        inserted++
      }

      return e.json(200, {
        success: true,
        collection: collectionName,
        deleted: deleted,
        inserted: inserted,
        message: 'Finalizado!',
      })
    } catch (err) {
      $app.logger().error('Import failed', 'error', String(err))
      return e.json(500, { error: 'Falha ao processar importação: ' + String(err) })
    }
  },
  $apis.requireAuth(),
  $apis.bodyLimit(52428800),
)
