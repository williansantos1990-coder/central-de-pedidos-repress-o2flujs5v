routerAdd(
  'POST',
  '/backend/v1/import',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('auth required')

    var body = e.requestInfo().body || {}
    var collectionName = body.collection
    var records = body.records || []
    var clear = body.clear === true

    if (!collectionName) return e.badRequestError('Colecao nao especificada')
    if (!records || records.length === 0) return e.badRequestError('Nenhum registro para importar')

    var collection
    try {
      collection = $app.findCollectionByNameOrId(collectionName)
    } catch (_) {
      return e.badRequestError('Colecao nao encontrada: ' + collectionName)
    }

    var deletedCount = 0
    if (clear) {
      try {
        deletedCount = $app.countRecords(collectionName)
        $app.truncateCollection(collection)
      } catch (_) {
        var batch
        while (true) {
          try {
            batch = $app.findRecordsByFilter(collectionName, "id != ''", '', 500, 0)
          } catch (_) {
            break
          }
          if (!batch || batch.length === 0) break
          for (var di = 0; di < batch.length; di++) {
            try {
              $app.delete(batch[di])
            } catch (_) {}
          }
        }
      }
    }

    var insertedCount = 0
    var errorCount = 0
    var errorDetails = []

    for (var i = 0; i < records.length; i++) {
      try {
        var record = new Record(collection)
        var data = records[i]
        var keys = Object.keys(data)
        for (var k = 0; k < keys.length; k++) {
          var fieldName = keys[k]
          if (fieldName === 'id' || fieldName === 'created' || fieldName === 'updated') continue
          var value = data[fieldName]
          if (value !== null && value !== undefined && value !== '') {
            record.set(fieldName, value)
          }
        }
        $app.save(record)
        insertedCount++
      } catch (err) {
        errorCount++
        if (errorDetails.length < 10) {
          errorDetails.push('Linha ' + (i + 1) + ': ' + err.toString().substring(0, 100))
        }
      }
    }

    return e.json(200, {
      success: true,
      inserted: insertedCount,
      errors: errorCount,
      deleted: deletedCount,
      errorDetails: errorDetails,
      message:
        errorCount > 0
          ? insertedCount + ' inseridos, ' + errorCount + ' erros'
          : insertedCount + ' registros importados com sucesso',
    })
  },
  $apis.requireAuth(),
)
