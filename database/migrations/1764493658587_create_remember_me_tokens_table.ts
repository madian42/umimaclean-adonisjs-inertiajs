import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.REMEMBER_ME_TOKENS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .uuid('tokenable_id')
        .notNullable()
        .references('id')
        .inTable(Tables.USERS)
        .onDelete('CASCADE')
      table.string('hash').notNullable().unique()

      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
