import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable(Tables.REVIEWS, (table) => {
      table.increments('id')
      table
        .uuid('transaction_item_id')
        .notNullable()
        .references('id')
        .inTable(Tables.TRANSACTION_ITEMS)
        .onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable(Tables.USERS).onDelete('CASCADE')

      table.integer('rating').notNullable().checkBetween([1, 5])
      table.text('comment').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(Tables.REVIEWS)
  }
}
