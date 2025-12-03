import Tables from '#enums/table_enum'
import TransactionStatuses from '#enums/transaction_status_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Creates transactions and transaction_items tables.
 * Each order has down_payment and full_payment transactions via Midtrans.
 */
export default class extends BaseSchema {
  async up() {
    /**
     * Payment transactions via Midtrans.
     * Types: down_payment (initial) and full_payment (after inspection).
     */
    this.schema.createTable(Tables.TRANSACTIONS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      table
        .enum('status', Object.values(TransactionStatuses))
        .notNullable()
        .defaultTo(TransactionStatuses.PENDING)

      table.enum('type', ['down_payment', 'full_payment']).notNullable()

      table.uuid('midtrans_id').notNullable()
      table.string('midtrans_status', 32).notNullable()
      table.string('midtrans_qr_code', 255).notNullable()

      table.decimal('amount', 10, 2).notNullable()

      table.timestamp('expired_at', { useTz: true }).notNullable()

      table.timestamp('payment_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * Line items linking shoes, services, and pricing.
     * Captures historical pricing at time of transaction.
     */
    this.schema.createTable(Tables.TRANSACTION_ITEMS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table
        .uuid('transaction_id')
        .notNullable()
        .references('id')
        .inTable(Tables.TRANSACTIONS)
        .onDelete('CASCADE')

      table.uuid('shoe_id').notNullable().references('id').inTable(Tables.SHOES).onDelete('CASCADE')

      table
        .uuid('service_id')
        .notNullable()
        .references('id')
        .inTable(Tables.SERVICES)
        .onDelete('CASCADE')

      table.decimal('item_price', 10, 2).notNullable()

      table.decimal('subtotal', 10, 2).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(Tables.TRANSACTION_ITEMS)
    this.schema.dropTable(Tables.TRANSACTIONS)
  }
}
