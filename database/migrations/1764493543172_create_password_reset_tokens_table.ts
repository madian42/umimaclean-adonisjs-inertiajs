import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.PASSWORD_RESET_TOKENS

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').notNullable().references('id').inTable(Tables.USERS).onDelete('CASCADE')

      table.string('token', 255).notNullable()

      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
