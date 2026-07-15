migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'carla.fernandes@repress.com.br')
      return // already exists
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('carla.fernandes@repress.com.br')
    record.setPassword('admin123') // 8 chars minimum
    record.setVerified(true)
    record.set('name', 'Carla Fernandes')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'carla.fernandes@repress.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
