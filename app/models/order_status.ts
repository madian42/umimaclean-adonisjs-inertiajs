import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Order from './order.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tables from '#enums/table_enum'
import OrderStatuses from '#enums/order_status_enum'

/**
 * OrderStatus Model
 *
 * Tracks the status history of an order throughout its lifecycle.
 * Each status change creates a new record, maintaining a complete audit trail.
 *
 * Business Logic:
 * - An order can have multiple status records (status history)
 * - The LATEST status (most recent updatedAt) represents the current order state
 * - Status changes are immutable - new records are created, old ones are kept
 * - Optional notes can be added to provide context for status changes
 *
 * Status Flow (typical):
 * 1. WAITING_DEPOSIT - Order created, awaiting down payment
 * 2. PICKUP_SCHEDULED - Payment received, pickup scheduled (online only)
 * 3. PICKUP_PROGRESS - Staff on the way to pickup (online only)
 * 4. INSPECTION - Shoes being inspected and assessed
 * 5. WAITING_PAYMENT - Full payment required after inspection
 * 6. IN_PROCESS - Shoes being cleaned
 * 7. PROCESS_COMPLETED - Cleaning done, ready for delivery/pickup
 * 8. DELIVERY - Out for delivery or ready for customer pickup
 * 9. COMPLETED - Order successfully completed
 * 10. CANCELLED - Order cancelled (can happen at any stage)
 *
 * Usage Example:
 * ```typescript
 * // Get current status
 * const order = await Order.find(orderId)
 * await order.load('statuses', (query) => {
 *   query.orderBy('updated_at', 'desc').limit(1)
 * })
 * const currentStatus = order.statuses[0].name
 *
 * // Create new status
 * await OrderStatus.create({
 *   orderId: order.id,
 *   name: OrderStatuses.IN_PROCESS,
 *   note: 'Started deep cleaning process'
 * })
 * ```
 */
export default class OrderStatus extends BaseModel {
  static table = Tables.ORDER_STATUSES

  @column({ isPrimary: true })
  declare id: number

  /**
   * Reference to the order this status belongs to
   */
  @column()
  declare orderId: string

  /**
   * Current status of the order
   * See OrderStatuses enum for all possible values
   */
  @column()
  declare name: OrderStatuses

  /**
   * Optional note providing context for this status change
   * Examples:
   * - "Customer requested express service"
   * - "Delivery delayed due to traffic"
   * - "Additional stain treatment required"
   */
  @column()
  declare note: string | null

  /**
   * Timestamp when this status was set
   * Used to determine order of status changes and current status
   * Auto-updates whenever the record is modified
   */
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Relationship to the order
   */
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>
}
