migrate(
  (app) => {
    const collection = new Collection({
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
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pedve012')
    app.delete(collection)
  },
)
