migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('transportadoras')
    } catch (_) {
      col = new Collection({
        name: 'transportadoras',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'destino', type: 'text', required: true },
          { name: 'uf', type: 'text' },
          { name: 'prazo_transportadora', type: 'number', onlyInt: true },
          { name: 'modal', type: 'text' },
          { name: 'padrao_exceda', type: 'text' },
          { name: 'transportadora', type: 'text' },
          { name: 'prazo_transp_desc', type: 'text' },
          { name: 'prazo_entrega', type: 'number', onlyInt: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_transportadoras_destino ON transportadoras (destino)',
          'CREATE INDEX idx_transportadoras_uf ON transportadoras (uf)',
          'CREATE INDEX idx_transportadoras_transportadora ON transportadoras (transportadora)',
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

    function ensureTextField(name) {
      if (fieldNames.indexOf(name) === -1) {
        col.fields.add(new TextField({ name: name }))
      }
    }
    function ensureNumberField(name) {
      if (fieldNames.indexOf(name) === -1) {
        col.fields.add(new NumberField({ name: name, onlyInt: true }))
      }
    }

    ensureTextField('padrao_exceda')
    ensureTextField('transportadora')
    ensureTextField('prazo_transp_desc')
    ensureNumberField('prazo_entrega')

    col.addIndex('idx_transportadoras_destino', false, 'destino', '')
    col.addIndex('idx_transportadoras_uf', false, 'uf', '')
    col.addIndex('idx_transportadoras_transportadora', false, 'transportadora', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transportadoras')
    col.removeIndex('idx_transportadoras_transportadora')
    app.save(col)
  },
)
