migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'fernanda.luz@repress.com.br')
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('fernanda.luz@repress.com.br')
    record.setPassword('admin1234')
    record.setVerified(true)
    record.set('name', 'Fernanda Luz')
    record.set('emailVisibility', true)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'fernanda.luz@repress.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
