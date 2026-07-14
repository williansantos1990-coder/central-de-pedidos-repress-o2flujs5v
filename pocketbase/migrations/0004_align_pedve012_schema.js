migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('pedve012')
    } catch (_) {
      col = new Collection({
        name: 'pedve012',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'pedido', type: 'text', required: true },
          { name: 'cliente', type: 'text' },
          { name: 'envio_liberacao', type: 'date' },
          { name: 'prev_entr', type: 'date' },
          { name: 'transmitir_nfe', type: 'date' },
          { name: 'tipo_entrega', type: 'text' },
          { name: 'cidade', type: 'text' },
          { name: 'uf', type: 'text' },
          { name: 'prazo_transportadora', type: 'number', onlyInt: true },
          { name: 'status', type: 'text' },
          { name: 'situacao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_pedve012_tipo_entrega ON pedve012 (tipo_entrega)',
          'CREATE INDEX idx_pedve012_envio_liberacao ON pedve012 (envio_liberacao)',
          'CREATE INDEX idx_pedve012_prev_entr ON pedve012 (prev_entr)',
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
    function ensureNumberField(name) {
      if (fieldNames.indexOf(name) === -1) {
        col.fields.add(new NumberField({ name: name, onlyInt: true }))
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
    ensureDateField('envio_liberacao')
    ensureDateField('prev_entr')
    ensureDateField('transmitir_nfe')
    ensureTextField('tipo_entrega', false)
    ensureTextField('cidade', false)
    ensureTextField('uf', false)
    ensureNumberField('prazo_transportadora')
    ensureTextField('status', false)
    ensureTextField('situacao', false)
    ensureAutodateField('created', true, false)
    ensureAutodateField('updated', true, true)

    col.addIndex('idx_pedve012_tipo_entrega', false, 'tipo_entrega', '')
    col.addIndex('idx_pedve012_envio_liberacao', false, 'envio_liberacao', '')
    col.addIndex('idx_pedve012_prev_entr', false, 'prev_entr', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('pedve012')
    col.removeIndex('idx_pedve012_tipo_entrega')
    col.removeIndex('idx_pedve012_envio_liberacao')
    col.removeIndex('idx_pedve012_prev_entr')
    app.save(col)
  },
)
