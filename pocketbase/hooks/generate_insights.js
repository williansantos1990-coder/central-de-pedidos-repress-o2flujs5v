routerAdd(
  'POST',
  '/backend/v1/insights',
  (e) => {
    const body = e.requestInfo().body || {}

    const pedidosLiberados = body.pedidosLiberados || 0
    const finalizados = body.finalizados || 0
    const naoFinalizou = body.naoFinalizou || 0
    const pedidosUrgentes = body.pedidosUrgentes || 0
    const liberadosApos11h = body.liberadosApos11h || 0
    const slaAderente = body.slaAderente || 0
    const slaForaDoSLA = body.slaForaDoSLA || 0
    const slaData = body.slaData || []

    const slaText = slaData
      .map(function (s) {
        return '- ' + (s.name || 'N/A') + ': ' + (s.value || 0)
      })
      .join('\n')

    const prompt =
      'Você é um analista de logística especializado em identificar gargalos operacionais. ' +
      'Analise os seguintes indicadores do dashboard de pedidos e gere insights acionáveis em português.\n\n' +
      'Indicadores Operacionais:\n' +
      '- Pedidos Liberados: ' +
      pedidosLiberados +
      '\n' +
      '- Finalizados (com transmissão NFe): ' +
      finalizados +
      '\n' +
      '- Não Finalizou (liberados sem transmissão NFe): ' +
      naoFinalizou +
      '\n' +
      '- Pedidos Urgentes (liberação na data da entrega): ' +
      pedidosUrgentes +
      '\n' +
      '- Liberados após 11h: ' +
      liberadosApos11h +
      '\n\n' +
      'Cumprimento de SLA (PEDVE012) — Aderência ao prazo da transportadora:\n' +
      slaText +
      '\n' +
      '- Aderente (dentro do SLA da transportadora): ' +
      slaAderente +
      '\n' +
      '- Fora do SLA (excedeu o prazo da transportadora): ' +
      slaForaDoSLA +
      '\n\n' +
      'Gere de 3 a 5 insights concisos e diretos, focados em gargalos operacionais, ' +
      'prazos de entrega, aderência ao SLA das transportadoras e otimização. ' +
      'Use apenas os dados fornecidos. ' +
      'Formato: lista com marcadores •.'

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um analista de logística especializado em identificar gargalos operacionais e otimizar prazos de entrega. Responda sempre em português brasileiro, de forma concisa e objetiva.',
          },
          { role: 'user', content: prompt },
        ],
      })

      return e.json(200, { content: reply.choices[0].message.content })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'IA temporariamente indisponível' })
      }
      if (err instanceof SkipAiError) {
        return e.json(502, { error: 'Falha ao gerar insights' })
      }
      return e.json(500, { error: 'Erro interno ao gerar insights' })
    }
  },
  $apis.requireAuth(),
)
