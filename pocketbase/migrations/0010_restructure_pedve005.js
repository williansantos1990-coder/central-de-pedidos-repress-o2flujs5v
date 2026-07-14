migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('pedve005')

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    var fieldsToRemove = ['pedido', 'cliente', 'prev_entr', 'tipo_entrega', 'cidade', 'uf']
    for (var i = 0; i < fieldsToRemove.length; i++) {
      if (col.fields.getByName(fieldsToRemove[i])) {
        col.fields.removeByName(fieldsToRemove[i])
      }
    }

    var newFields = [
      { name: 'pedido', type: 'text', required: true },
      { name: 'emissao', type: 'date' },
      { name: 'cliente', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'tp_estoque', type: 'text' },
      { name: 'bairro', type: 'text' },
      { name: 'cidade', type: 'text' },
      { name: 'doc_remessa', type: 'text' },
      { name: 'prev_entr', type: 'date' },
      { name: 'rota', type: 'text' },
      { name: 'tp_entrega', type: 'text' },
      { name: 'receb_destino', type: 'text' },
      { name: 'vl_ped_rs', type: 'number' },
      { name: 'vl_ord_rem_rs', type: 'number' },
      { name: 'cubagem_local_estoque', type: 'number' },
      { name: 'volume_local_estoque', type: 'number' },
      { name: 'qtd_itens', type: 'number', onlyInt: true },
      { name: 'observacao', type: 'text' },
    ]

    for (var j = 0; j < newFields.length; j++) {
      var f = newFields[j]
      if (!col.fields.getByName(f.name)) {
        if (f.type === 'text') {
          col.fields.add(new TextField({ name: f.name, required: !!f.required }))
        } else if (f.type === 'date') {
          col.fields.add(new DateField({ name: f.name }))
        } else if (f.type === 'number') {
          col.fields.add(new NumberField({ name: f.name, onlyInt: !!f.onlyInt }))
        }
      }
    }

    if (!col.fields.getByName('created')) {
      col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
    }
    if (!col.fields.getByName('updated')) {
      col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    }

    col.addIndex('idx_pedve005_pedido', false, 'pedido', '')
    col.addIndex('idx_pedve005_prev_entr', false, 'prev_entr', '')

    app.save(col)
  },
  (app) => {},
)
