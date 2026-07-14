migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('pedve012')

    if (!col.fields.getByName('transito')) {
      col.fields.add(new DateField({ name: 'transito' }))
    }
    if (!col.fields.getByName('entrega')) {
      col.fields.add(new DateField({ name: 'entrega' }))
    }

    function ensureDateType(fieldName) {
      var existing = col.fields.getByName(fieldName)
      if (!existing) {
        col.fields.add(new DateField({ name: fieldName }))
        return
      }
      if (existing.type === 'date') return
      col.fields.removeByName(fieldName)
      col.fields.add(new DateField({ name: fieldName }))
    }

    ensureDateType('nfe_transmitida')
    ensureDateType('colocado_transito')
    ensureDateType('marcado_entrega')

    if (!col.fields.getByName('created')) {
      col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
    }
    if (!col.fields.getByName('updated')) {
      col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    }

    app.save(col)
  },
  (app) => {},
)
