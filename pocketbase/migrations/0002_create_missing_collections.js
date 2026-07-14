migrate(
  (app) => {
    const pedve005 = new Collection({
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
    app.save(pedve005)

    const transportadoras = new Collection({
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
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_transportadoras_destino ON transportadoras (destino)',
        'CREATE INDEX idx_transportadoras_uf ON transportadoras (uf)',
      ],
    })
    app.save(transportadoras)
  },
  (app) => {
    try {
      const c1 = app.findCollectionByNameOrId('pedve005')
      app.delete(c1)
    } catch (_) {}
    try {
      const c2 = app.findCollectionByNameOrId('transportadoras')
      app.delete(c2)
    } catch (_) {}
  },
)
