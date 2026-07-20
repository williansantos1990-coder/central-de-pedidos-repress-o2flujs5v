migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('pedve012')

    const existing = col.fields.getByName('cubagem_local_estoque')
    if (!existing) return

    // Step 1: Add temporary text field
    if (!col.fields.getByName('cubagem_tmp_text')) {
      col.fields.add(new TextField({ name: 'cubagem_tmp_text' }))
      app.save(col)
    }

    // Step 2: Copy data from number field to temp text field
    app
      .db()
      .newQuery(
        'UPDATE pedve012 SET cubagem_tmp_text = CAST(cubagem_local_estoque AS TEXT) WHERE cubagem_local_estoque IS NOT NULL',
      )
      .execute()

    // Step 3: Remove old number field
    col.fields.removeByName('cubagem_local_estoque')
    app.save(col)

    // Step 4: Add new text field with original name
    col.fields.add(new TextField({ name: 'cubagem_local_estoque' }))
    app.save(col)

    // Step 5: Copy data from temp to new field
    app.db().newQuery('UPDATE pedve012 SET cubagem_local_estoque = cubagem_tmp_text').execute()

    // Step 6: Remove temp field
    const tmp = col.fields.getByName('cubagem_tmp_text')
    if (tmp) {
      col.fields.removeByName('cubagem_tmp_text')
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('pedve012')
    const field = col.fields.getByName('cubagem_local_estoque')
    if (field) {
      col.fields.removeByName('cubagem_local_estoque')
      col.fields.add(new NumberField({ name: 'cubagem_local_estoque' }))
      app.save(col)
    }
  },
)
