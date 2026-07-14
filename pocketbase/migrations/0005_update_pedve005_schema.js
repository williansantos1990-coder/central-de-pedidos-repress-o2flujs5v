migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('pedve005')
    } catch (_) {
      col = new Collection({
        name: 'pedve005',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'pedido', type: 'text', required: true },
          { name: 'cliente', type: 'text' },
          { name: 'prev_entr', type: 'date' },
          { name: 'tipo_entrega', type: 'text' },
          { name: 'cidade', type: 'text' },
          { name: 'uf', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_pedve005_pedido ON pedve005 (pedido)',
          'CREATE INDEX idx_pedve005_prev_entr ON pedve005 (prev_entr)',
        ],
      })
      app.save(col)
      return
    }

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    const fieldNames = []
    const fields = col.fields
    for (const f of fields) {
      fieldNames.push(f.name)
    }

    function ensureTextField(name, required) {
      if (fieldNames.indexOf(name) === -1) {
        col.fields.add(new TextField({ name: name, required: !!required }))
      }
    }
    function ensureDateField(name) {
      if (fieldNames.indexOf(name) === -1) {
        col.fields.add(new DateField({ name: name }))
      }
    }
    function ensureAutodateField(name, onCreate, onUpdate) {
      if (fieldNames.indexOf(name) === -1) {
        col.fields.add(
          new AutodateField({ name: name, onCreate: !!onCreate, onUpdate: !!onUpdate }),
        )
      }
    }

    ensureTextField('pedido', true)
    ensureTextField('cliente', false)
    ensureDateField('prev_entr')
    ensureTextField('tipo_entrega', false)
    ensureTextField('cidade', false)
    ensureTextField('uf', false)
    ensureAutodateField('created', true, false)
    ensureAutodateField('updated', true, true)

    col.addIndex('idx_pedve005_pedido', false, 'pedido', '')
    col.addIndex('idx_pedve005_prev_entr', false, 'prev_entr', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('pedve005')
    col.removeIndex('idx_pedve005_pedido')
    col.removeIndex('idx_pedve005_prev_entr')
    app.save(col)
  },
)
