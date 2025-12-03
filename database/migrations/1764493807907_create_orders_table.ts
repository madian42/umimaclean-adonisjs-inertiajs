import OrderActions from '#enums/order_action_enum'
import OrderPhotoStages from '#enums/order_photo_stage_enum'
import OrderStatuses from '#enums/order_status_enum'
import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Creates order management tables: orders, order_statuses, order_photos, order_actions.
 * Address is required for all order types (online: customer location, offline: store with customer contact).
 */
export default class extends BaseSchema {
  async up() {
    /**
     * Main order records. Type: online (pickup/delivery) or offline (store drop-off).
     * Address required for all: online uses customer location, offline uses store with customer contact.
     */
    this.schema.createTable(Tables.ORDERS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table.uuid('user_id').notNullable().references('id').inTable(Tables.USERS).onDelete('CASCADE')

      table
        .uuid('address_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ADDRESSES)
        .onDelete('CASCADE')

      table.string('number').notNullable().unique()

      table.date('date').notNullable()

      table.enum('type', ['online', 'offline']).notNullable().defaultTo('online')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * Status history. Latest record (by updated_at) is current status.
     */
    this.schema.createTable(Tables.ORDER_STATUSES, (table) => {
      table.increments('id')

      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      table
        .enum('name', Object.values(OrderStatuses))
        .notNullable()
        .defaultTo(OrderStatuses.WAITING_DEPOSIT)

      table.text('note').nullable()

      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * Photos at pickup, inspection, and delivery stages.
     */
    this.schema.createTable(Tables.ORDER_PHOTOS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      table
        .uuid('admin_id')
        .notNullable()
        .references('id')
        .inTable(Tables.USERS)
        .onDelete('CASCADE')

      table.enum('stage', Object.values(OrderPhotoStages)).notNullable()

      table.text('path').notNullable()

      table.text('note').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * Staff actions with stage locking.
     * Staff claims stage (ATTEMPT), completes (action), or releases.
     */
    this.schema.createTable(Tables.ORDER_ACTIONS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      table
        .uuid('order_photo_id')
        .nullable()
        .references('id')
        .inTable(Tables.ORDER_PHOTOS)
        .onDelete('CASCADE')

      table
        .uuid('admin_id')
        .notNullable()
        .references('id')
        .inTable(Tables.USERS)
        .onDelete('CASCADE')

      table.enum('action', Object.values(OrderActions)).notNullable()

      table.text('note').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(Tables.ORDER_ACTIONS)
    this.schema.dropTable(Tables.ORDER_PHOTOS)
    this.schema.dropTable(Tables.ORDER_STATUSES)
    this.schema.dropTable(Tables.ORDERS)
  }
}
