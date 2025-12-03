import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable(Tables.PUSH_NOTIFICATIONS, (table) => {
      table.increments('id')
      table.uuid('user_id').notNullable().references('id').inTable(Tables.USERS).onDelete('CASCADE')

      table.text('endpoint').notNullable().unique()
      table.text('auth').notNullable()
      table.string('p256dh').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable(Tables.NOTIFICATIONS, (table) => {
      table.increments('id')
      table.uuid('user_id').notNullable().references('id').inTable(Tables.USERS).onDelete('CASCADE')

      table.string('title').notNullable()
      table.text('message').notNullable()
      table.boolean('is_read').defaultTo(false)
      table.string('type').notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(Tables.PUSH_NOTIFICATIONS)
    this.schema.dropTable(Tables.NOTIFICATIONS)
  }
}
