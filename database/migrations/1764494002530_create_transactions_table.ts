import Tables from '#enums/table_enum'
import TransactionStatuses from '#enums/transaction_status_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Transactions Migration
 *
 * Creates two tables:
 * 1. transactions - Payment transactions for orders
 * 2. transaction_items - Line items linking shoes, services, and pricing
 *
 * Business Logic:
 * - Each order can have multiple transactions (down payment + full payment)
 * - Each transaction has multiple items (shoe + service combinations)
 * - Transactions are ALWAYS linked to orders (even for offline customers)
 * - Payment processing is handled through Midtrans payment gateway
 *
 * Payment Flow:
 * 1. Customer creates order
 * 2. Down payment transaction created (30-50% of total)
 * 3. After inspection, full payment transaction created
 * 4. Both payments must be completed before order can proceed
 */
export default class extends BaseSchema {
  async up() {
    /**
     * TRANSACTIONS Table
     *
     * Stores payment transaction records for orders.
     * Integrates with Midtrans payment gateway for payment processing.
     *
     * Fields:
     * - id: UUID primary key
     * - order_id: Reference to order (CHANGED from booking_id)
     * - status: Transaction status (pending, paid, failed, expired, cancelled)
     * - type: Payment type ('down_payment' | 'full_payment')
     * - amount: Total amount to be paid
     * - midtrans_id: Unique transaction ID from Midtrans
     * - midtrans_status: Payment status from Midtrans
     * - midtrans_qr_code: QR code URL for QRIS payment
     * - expired_at: Payment deadline (typically 24 hours)
     * - payment_at: When payment was completed (NULL if unpaid)
     * - created_at: When transaction was created
     * - updated_at: Last modification
     *
     * Transaction Types:
     * - DOWN_PAYMENT: Initial deposit required to start order
     *   Typically 30-50% of total
     *   Must be paid before pickup/inspection
     *
     * - FULL_PAYMENT: Remaining balance after inspection
     *   Amount may be adjusted based on inspection findings
     *   Must be paid before delivery/final pickup
     *
     * IMPORTANT: order_id is NOT NULLABLE
     * Even offline/offline transactions MUST be linked to an order.
     * Staff should create order first, then transaction.
     *
     * Midtrans Integration:
     * - midtrans_id: Used to track payment in Midtrans system
     * - midtrans_status: Updated via webhook (settlement, pending, deny, etc.)
     * - midtrans_qr_code: QRIS QR code for mobile payment
     * - expired_at: Midtrans automatically rejects payments after this time
     *
     * Status Values:
     * - PENDING: Transaction created, waiting for payment
     * - PAID: Payment successfully received
     * - FAILED: Payment attempt failed
     * - EXPIRED: Transaction expired before payment
     * - CANCELLED: Transaction cancelled by user or staff
     */
    this.schema.createTable(Tables.TRANSACTIONS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Reference to order (CHANGED from booking_id to order_id)
      // NOT NULLABLE - all transactions must be linked to an order
      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS) // Changed from BOOKINGS to ORDERS
        .onDelete('CASCADE')

      // Transaction status (internal tracking)
      table
        .enum('status', Object.values(TransactionStatuses))
        .notNullable()
        .defaultTo(TransactionStatuses.PENDING)

      // Payment type - determines when payment is required
      table.enum('type', ['down_payment', 'full_payment']).notNullable()

      // Midtrans payment gateway fields
      table.uuid('midtrans_id').notNullable()
      table.string('midtrans_status', 32).notNullable()
      table.string('midtrans_qr_code', 255).notNullable()

      // Total amount to be paid (in smallest currency unit - e.g., IDR without decimals)
      table.decimal('amount', 10, 2).notNullable()

      // Payment deadline - transaction expires if not paid by this time
      table.timestamp('expired_at', { useTz: true }).notNullable()

      // When payment was successfully completed (NULL if unpaid)
      table.timestamp('payment_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * TRANSACTION_ITEMS Table
     *
     * Line items that make up a transaction.
     * Links shoes with services and captures pricing at time of transaction.
     *
     * Fields:
     * - id: UUID primary key
     * - transaction_id: Reference to transaction
     * - shoe_id: Reference to shoe
     * - service_id: Reference to service
     * - item_price: Service price at time of transaction
     * - subtotal: Total for this item (item_price * quantity, currently quantity is always 1)
     * - created_at: When item was created
     * - updated_at: Last modification
     *
     * Business Logic:
     * - One transaction can have multiple items
     * - One item = one shoe + one service combination
     * - If a shoe has 3 services, it creates 3 transaction items
     * - item_price captures price at time of order (historical pricing)
     * - subtotal is currently same as item_price (quantity always 1)
     *
     * Example Transaction:
     * Order with 2 shoes, each with different services:
     *
     * Transaction (down_payment):
     *   Item 1: Nike + Deep Cleaning = 50,000
     *   Item 2: Nike + Waterproofing = 20,000
     *   Item 3: Adidas + Basic Wash = 30,000
     *   Item 4: Adidas + Deodorizing = 10,000
     *   Total: 110,000 IDR
     *
     * Why Store item_price Separately:
     * - Service prices can change over time
     * - Transaction items preserve historical pricing
     * - Ensures order total doesn't change when service prices are updated
     * - Required for accurate financial reporting
     *
     * Why subtotal Field:
     * - Prepared for future quantity support (e.g., buy 2 get 1 free)
     * - Allows for item-level discounts
     * - Currently: subtotal = item_price * 1
     */
    this.schema.createTable(Tables.TRANSACTION_ITEMS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Reference to transaction
      table
        .uuid('transaction_id')
        .notNullable()
        .references('id')
        .inTable(Tables.TRANSACTIONS)
        .onDelete('CASCADE')

      // Reference to shoe being cleaned
      table.uuid('shoe_id').notNullable().references('id').inTable(Tables.SHOES).onDelete('CASCADE')

      // Reference to service being applied
      table
        .uuid('service_id')
        .notNullable()
        .references('id')
        .inTable(Tables.SERVICES)
        .onDelete('CASCADE')

      // Service price at time of transaction (historical pricing)
      table.decimal('item_price', 10, 2).notNullable()

      // Total for this item (currently same as item_price, prepared for quantity/discounts)
      table.decimal('subtotal', 10, 2).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    // Drop in reverse order due to foreign key constraints
    this.schema.dropTable(Tables.TRANSACTION_ITEMS)
    this.schema.dropTable(Tables.TRANSACTIONS)
  }
}
