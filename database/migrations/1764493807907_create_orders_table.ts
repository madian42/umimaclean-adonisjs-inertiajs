import OrderActions from '#enums/order_action_enum'
import OrderPhotoStages from '#enums/order_photo_stage_enum'
import OrderStatuses from '#enums/order_status_enum'
import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Orders Migration
 *
 * Creates tables for order management system:
 * 1. orders - Main order records (renamed from bookings)
 * 2. order_statuses - Order status history
 * 3. order_photos - Photos taken during order processing
 * 4. order_actions - Staff actions on orders
 *
 * Key Changes from Bookings:
 * - Renamed all tables from booking_* to order_*
 * - address_id is REQUIRED for all order types (NOT NULLABLE)
 * - Added type field ('online' | 'offline') to distinguish order types
 *
 * Business Logic:
 * - Online orders: address_id points to customer's real delivery address
 * - offline orders: address_id points to store location with customer contact info
 * - Both order types ALWAYS have an address (different purposes)
 * - Both order types go through same processing workflow
 */
export default class extends BaseSchema {
  async up() {
    /**
     * ORDERS Table
     *
     * Main table storing order information.
     * An order represents a shoe cleaning job - can be online or offline.
     *
     * Fields:
     * - id: UUID primary key
     * - user_id: Customer who placed the order (required)
     * - address_id: Address reference (REQUIRED - NOT NULLABLE)
     * - number: Unique order number (format: ORD{YY}{MM}{DD}-{NNN})
     * - date: Scheduled completion/delivery date
     * - type: 'online' or 'offline' - determines workflow
     * - created_at: When order was created
     * - updated_at: Last modification timestamp
     *
     * IMPORTANT: address_id is REQUIRED for ALL order types:
     * - Online orders: address_id = customer's real delivery address
     * - offline orders: address_id = store location with customer contact info
     */
    this.schema.createTable(Tables.ORDERS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Customer reference - required for all orders
      table.uuid('user_id').notNullable().references('id').inTable(Tables.USERS).onDelete('CASCADE')

      // Address is REQUIRED for ALL orders (NOT NULLABLE)
      // Online orders: customer's delivery address
      // offline orders: store location with customer contact info
      table
        .uuid('address_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ADDRESSES)
        .onDelete('CASCADE')

      // Unique order identifier - auto-generated
      table.string('number').notNullable().unique()

      // Scheduled completion date
      table.date('date').notNullable()

      // Order type - determines if pickup/delivery needed
      // 'online' = requires pickup from address and delivery back
      // 'offline' = customer drops off and picks up at store
      table.enum('type', ['online', 'offline']).notNullable().defaultTo('online')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * ORDER_STATUSES Table
     *
     * Tracks status history for each order.
     * Each status change creates a new record (immutable history).
     *
     * Fields:
     * - id: Auto-increment primary key
     * - order_id: Reference to order
     * - name: Status enum value (waiting_deposit, pickup_scheduled, etc.)
     * - note: Optional context for status change
     * - updated_at: When this status was set (used to determine current status)
     *
     * Business Logic:
     * - Multiple records per order (status history)
     * - Latest record (by updated_at) = current status
     * - Old records preserved for audit trail
     */
    this.schema.createTable(Tables.ORDER_STATUSES, (table) => {
      table.increments('id')

      // Reference to order
      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      // Status value from enum
      table
        .enum('name', Object.values(OrderStatuses))
        .notNullable()
        .defaultTo(OrderStatuses.WAITING_DEPOSIT)

      // Optional note providing context
      table.text('note').nullable()

      // Timestamp when status was set (determines order of status changes)
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * ORDER_PHOTOS Table
     *
     * Stores photos taken during order processing.
     * Photos document shoe condition at key stages (pickup, inspection, delivery).
     *
     * Fields:
     * - id: UUID primary key
     * - order_id: Reference to order
     * - admin_id: Staff member who uploaded photo
     * - stage: When photo was taken (pickup/check/delivery)
     * - path: File storage path
     * - note: Optional description of photo
     * - created_at: Upload timestamp
     * - updated_at: Last modification
     *
     * Business Logic:
     * - Multiple photos can be uploaded per stage
     * - Required for quality control and dispute resolution
     * - Provides transparency to customers
     */
    this.schema.createTable(Tables.ORDER_PHOTOS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Reference to order
      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      // Staff member who uploaded photo
      table
        .uuid('admin_id')
        .notNullable()
        .references('id')
        .inTable(Tables.USERS)
        .onDelete('CASCADE')

      // Stage when photo was taken
      table.enum('stage', Object.values(OrderPhotoStages)).notNullable()

      // File path where photo is stored
      table.text('path').notNullable()

      // Optional note about photo
      table.text('note').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * ORDER_ACTIONS Table
     *
     * Tracks staff actions performed on orders.
     * Implements stage locking mechanism - staff must claim stage before working on it.
     *
     * Fields:
     * - id: UUID primary key
     * - order_id: Reference to order
     * - order_photo_id: Optional reference to photo taken during action
     * - admin_id: Staff member who performed action
     * - action: Action type (ATTEMPT_*, *, RELEASE_*)
     * - note: Optional context
     * - created_at: When action was performed
     *
     * Business Logic:
     * - Staff must ATTEMPT_* before completing stage
     * - Only staff who ATTEMPTED can complete or RELEASE
     * - Prevents multiple staff from working on same stage
     * - Used by StageMiddleware to enforce workflow
     *
     * Action Flow:
     * 1. Staff creates ATTEMPT_PICKUP action (claims stage)
     * 2. Staff works on pickup
     * 3. Staff creates PICKUP action (completes stage) OR
     *    Staff creates RELEASE_PICKUP action (releases without completion)
     */
    this.schema.createTable(Tables.ORDER_ACTIONS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Reference to order
      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS)
        .onDelete('CASCADE')

      // Optional reference to photo (typically set on completion actions)
      table
        .uuid('order_photo_id')
        .nullable()
        .references('id')
        .inTable(Tables.ORDER_PHOTOS)
        .onDelete('CASCADE')

      // Staff member who performed action
      table
        .uuid('admin_id')
        .notNullable()
        .references('id')
        .inTable(Tables.USERS)
        .onDelete('CASCADE')

      // Action performed
      table.enum('action', Object.values(OrderActions)).notNullable()

      // Optional context note
      table.text('note').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    // Drop in reverse order due to foreign key constraints
    this.schema.dropTable(Tables.ORDER_ACTIONS)
    this.schema.dropTable(Tables.ORDER_PHOTOS)
    this.schema.dropTable(Tables.ORDER_STATUSES)
    this.schema.dropTable(Tables.ORDERS)
  }
}
