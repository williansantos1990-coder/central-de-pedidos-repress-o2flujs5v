routerAdd(
  'POST',
  '/backend/v1/import',
  (e) => {
    const body = e.requestInfo().body || {}
    const collectionName = body.collection
    const records = body.records
    const userId = e.auth?.id

    if (!userId) return e.unauthorizedError('auth required')
    if (!collectionName) return e.badRequestError('collection is required')
    if (!Array.isArray(records)) return e.badRequestError('records must be an array')

    const allowedCollections = ['pedve012', 'pedve005', 'transportadoras']
    if (allowedCollections.indexOf(collectionName) === -1) {
      return e.badRequestError('collection not allowed for import')
    }

    let collection
    try {
      collection = $app.findCollectionByNameOrId(collectionName)
    } catch (_) {
      return e.badRequestError('collection not found')
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      try {
        const record = new Record(collection)
        const fields = collection.fields
        const fieldNames = []
        for (const f of fields) {
          fieldNames.push(f.name)
        }

        for (let j = 0; j < fieldNames.length; j++) {
          const fn = fieldNames[j]
          if (fn === 'id' || fn === 'created' || fn === 'updated') continue
          if (row[fn] !== undefined && row[fn] !== null) {
            record.set(fn, row[fn])
          }
        }

        $app.save(record)
        successCount++
        results.push({ index: i, id: record.id, success: true })
      } catch (err) {
        errorCount++
        results.push({ index: i, success: false, error: err.message || 'unknown error' })
      }
    }

    return e.json(200, {
      collection: collectionName,
      total: records.length,
      success: successCount,
      errors: errorCount,
      results: results,
    })
  },
  $apis.requireAuth(),
)
