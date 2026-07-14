migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'gil.araujo@repress.com.br')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('gil.araujo@repress.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Gil Araujo')
      app.save(record)
    }

    const pedve012Col = app.findCollectionByNameOrId('pedve012')
    const pedve012Data = [
      {
        pedido: 'PED-2026-001',
        cliente: 'Supermercado Bom Preço',
        envio_liberacao: '2026-07-10',
        prev_entr: '2026-07-20',
        transmitir_nfe: '2026-07-12',
        tipo_entrega: 'Rodoviário',
        cidade: 'São Paulo',
        uf: 'SP',
        prazo_transportadora: 5,
        status: 'Aguardando Separação',
        situacao: 'Em Processamento',
      },
      {
        pedido: 'PED-2026-002',
        cliente: 'Distribuidora Central',
        envio_liberacao: '2026-07-08',
        prev_entr: '2026-07-18',
        transmitir_nfe: '2026-07-10',
        tipo_entrega: 'Rodoviário',
        cidade: 'Rio de Janeiro',
        uf: 'RJ',
        prazo_transportadora: 7,
        status: 'Finalizado',
        situacao: 'Concluído',
      },
      {
        pedido: 'PED-2026-003',
        cliente: 'Farmácia Saúde Total',
        envio_liberacao: '2026-07-12',
        prev_entr: '2026-07-22',
        transmitir_nfe: '2026-07-14',
        tipo_entrega: 'Aéreo',
        cidade: 'Manaus',
        uf: 'AM',
        prazo_transportadora: 10,
        status: 'Em Transporte',
        situacao: 'Em Trânsito',
      },
      {
        pedido: 'PED-2026-004',
        cliente: 'Mercado Econômico',
        envio_liberacao: '2026-07-09',
        prev_entr: '2026-07-19',
        transmitir_nfe: '2026-07-11',
        tipo_entrega: 'Rodoviário',
        cidade: 'Belo Horizonte',
        uf: 'MG',
        prazo_transportadora: 4,
        status: 'Aguardando Separação',
        situacao: 'Pendente',
      },
      {
        pedido: 'PED-2026-005',
        cliente: 'Atacadão Preço Bom',
        envio_liberacao: '2026-07-05',
        prev_entr: '2026-07-15',
        transmitir_nfe: '2026-07-07',
        tipo_entrega: 'Rodoviário',
        cidade: 'Curitiba',
        uf: 'PR',
        prazo_transportadora: 6,
        status: 'Finalizado',
        situacao: 'Concluído',
      },
      {
        pedido: 'PED-2026-006',
        cliente: 'Super Center Compras',
        envio_liberacao: '2026-07-11',
        prev_entr: '2026-07-21',
        transmitir_nfe: '2026-07-13',
        tipo_entrega: 'Rodoviário',
        cidade: 'Porto Alegre',
        uf: 'RS',
        prazo_transportadora: 8,
        status: 'Gargalo',
        situacao: 'Atrasado',
      },
      {
        pedido: 'PED-2026-007',
        cliente: 'Lojas Conforto',
        envio_liberacao: '2026-07-07',
        prev_entr: '2026-07-17',
        transmitir_nfe: '2026-07-09',
        tipo_entrega: 'Aéreo',
        cidade: 'Salvador',
        uf: 'BA',
        prazo_transportadora: 9,
        status: 'Transmitido NFe',
        situacao: 'Concluído',
      },
      {
        pedido: 'PED-2026-008',
        cliente: 'Comercial Império',
        envio_liberacao: '2026-07-06',
        prev_entr: '2026-07-16',
        transmitir_nfe: '2026-07-08',
        tipo_entrega: 'Rodoviário',
        cidade: 'Fortaleza',
        uf: 'CE',
        prazo_transportadora: 12,
        status: 'Aguardando Separação',
        situacao: 'Em Processamento',
      },
    ]
    for (const s of pedve012Data) {
      try {
        app.findFirstRecordByData('pedve012', 'pedido', s.pedido)
      } catch (_) {
        const r = new Record(pedve012Col)
        for (const [k, v] of Object.entries(s)) r.set(k, v)
        app.save(r)
      }
    }

    const pedve005Col = app.findCollectionByNameOrId('pedve005')
    const pedve005Data = [
      {
        pedido: 'PED-2026-001',
        cliente: 'Supermercado Bom Preço',
        prev_entr: '2026-07-20',
        tipo_entrega: 'Rodoviário',
        cidade: 'São Paulo',
        uf: 'SP',
      },
      {
        pedido: 'PED-2026-002',
        cliente: 'Distribuidora Central',
        prev_entr: '2026-07-18',
        tipo_entrega: 'Rodoviário',
        cidade: 'Rio de Janeiro',
        uf: 'RJ',
      },
      {
        pedido: 'PED-2026-003',
        cliente: 'Farmácia Saúde Total',
        prev_entr: '2026-07-22',
        tipo_entrega: 'Aéreo',
        cidade: 'Manaus',
        uf: 'AM',
      },
      {
        pedido: 'PED-2026-004',
        cliente: 'Mercado Econômico',
        prev_entr: '2026-07-19',
        tipo_entrega: 'Rodoviário',
        cidade: 'Belo Horizonte',
        uf: 'MG',
      },
      {
        pedido: 'PED-2026-005',
        cliente: 'Atacadão Preço Bom',
        prev_entr: '2026-07-15',
        tipo_entrega: 'Rodoviário',
        cidade: 'Curitiba',
        uf: 'PR',
      },
      {
        pedido: 'PED-2026-006',
        cliente: 'Super Center Compras',
        prev_entr: '2026-07-21',
        tipo_entrega: 'Rodoviário',
        cidade: 'Porto Alegre',
        uf: 'RS',
      },
      {
        pedido: 'PED-2026-007',
        cliente: 'Lojas Conforto',
        prev_entr: '2026-07-17',
        tipo_entrega: 'Aéreo',
        cidade: 'Salvador',
        uf: 'BA',
      },
      {
        pedido: 'PED-2026-008',
        cliente: 'Comercial Império',
        prev_entr: '2026-07-16',
        tipo_entrega: 'Rodoviário',
        cidade: 'Fortaleza',
        uf: 'CE',
      },
    ]
    for (const s of pedve005Data) {
      try {
        app.findFirstRecordByData('pedve005', 'pedido', s.pedido)
      } catch (_) {
        const r = new Record(pedve005Col)
        for (const [k, v] of Object.entries(s)) r.set(k, v)
        app.save(r)
      }
    }

    const transpCol = app.findCollectionByNameOrId('transportadoras')
    const transpData = [
      { destino: 'São Paulo', uf: 'SP', prazo_transportadora: 5, modal: 'Rodoviário' },
      { destino: 'Rio de Janeiro', uf: 'RJ', prazo_transportadora: 7, modal: 'Rodoviário' },
      { destino: 'Manaus', uf: 'AM', prazo_transportadora: 10, modal: 'Aéreo' },
      { destino: 'Belo Horizonte', uf: 'MG', prazo_transportadora: 4, modal: 'Rodoviário' },
      { destino: 'Curitiba', uf: 'PR', prazo_transportadora: 6, modal: 'Rodoviário' },
      { destino: 'Porto Alegre', uf: 'RS', prazo_transportadora: 8, modal: 'Rodoviário' },
      { destino: 'Salvador', uf: 'BA', prazo_transportadora: 9, modal: 'Aéreo' },
      { destino: 'Fortaleza', uf: 'CE', prazo_transportadora: 12, modal: 'Rodoviário' },
    ]
    for (const s of transpData) {
      try {
        app.findFirstRecordByData('transportadoras', 'destino', s.destino)
      } catch (_) {
        const r = new Record(transpCol)
        for (const [k, v] of Object.entries(s)) r.set(k, v)
        app.save(r)
      }
    }
  },
  (app) => {
    try {
      const r = app.findAuthRecordByEmail('_pb_users_auth_', 'gil.araujo@repress.com.br')
      app.delete(r)
    } catch (_) {}
  },
)
