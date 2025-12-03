import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Creates shoes and services tables.
 * Shoes linked to orders; services linked via transaction_items.
 */
export default class extends BaseSchema {
  async up() {
    /**
     * Individual shoes submitted for cleaning.
     * Material determines cleaning method.
     */
    this.schema.createTable(Tables.SHOES, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      table.string('brand').notNullable()
      table.integer('size').notNullable()
      table.string('type').notNullable()

      table.string('material').notNullable()

      table.string('category').notNullable()

      table.string('condition').notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * Available cleaning services.
     * Types: primary (fixed price), additional (add-ons), start_from (variable pricing).
     */
    this.schema.createTable(Tables.SERVICES, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table.string('name').notNullable()
      table.text('description').nullable()

      table.enum('type', ['primary', 'additional', 'start_from']).notNullable()

      table.decimal('price', 8, 2).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(Tables.SERVICES)
    this.schema.dropTable(Tables.SHOES)
  }
}
