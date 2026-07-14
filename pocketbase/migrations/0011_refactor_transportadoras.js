migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('transportadoras')

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    var fieldsToRemove = [
      'modal',
      'prazo_transp_desc',
      'padrao_exceda',
      'prazo_entrega',
      'prazo_transportadora',
    ]
    for (var i = 0; i < fieldsToRemove.length; i++) {
      if (col.fields.getByName(fieldsToRemove[i])) {
        col.fields.removeByName(fieldsToRemove[i])
      }
    }

    if (!col.fields.getByName('padrao_do_exceda')) {
      col.fields.add(new TextField({ name: 'padrao_do_exceda' }))
    }
    if (!col.fields.getByName('prazo_de_entrega')) {
      col.fields.add(new NumberField({ name: 'prazo_de_entrega' }))
    }
    if (!col.fields.getByName('prazo_transportadora')) {
      col.fields.add(new TextField({ name: 'prazo_transportadora' }))
    }

    if (!col.fields.getByName('created')) {
      col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
    }
    if (!col.fields.getByName('updated')) {
      col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    }

    col.addIndex('idx_transportadoras_destino', false, 'destino', '')
    col.addIndex('idx_transportadoras_uf', false, 'uf', '')
    col.addIndex('idx_transportadoras_transportadora', false, 'transportadora', '')

    app.save(col)
  },
  (app) => {},
)
