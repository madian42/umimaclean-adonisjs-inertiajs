import Tables from '#enums/table_enum'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import Transaction from './transaction.js'
import Shoe from './shoe.js'
import Address from './address.js'
import OrderPhoto from './order_photo.js'
import OrderStatus from './order_status.js'
import OrderAction from './order_action.js'

/**
 * Order Model
 *
 * Represents a shoe cleaning order - can be either:
 * 1. ONLINE order - Customer books online, shoes picked up from address, cleaned, then delivered back
 * 2. offline order - Customer comes to store, drops off shoes, picks up later when done
 *
 * Key Differences:
 * - Online orders: addressId points to customer's real delivery location
 * - offline orders: addressId points to address with store coordinates + customer contact info
 * - Both types ALWAYS have an address (no nullable foreign key)
 * - Both types take processing time (e.g., 4 days regular, 1 day express)
 *
 * Business Logic:
 * - Every order gets a unique number generated automatically (format: ORD{YY}{MM}{DD}-{NNN})
 * - ALL orders have an address (online: customer's location, offline: store location with customer info)
 * - Order tracks multiple shoes and their services through TransactionItems
 * - Order status is tracked separately in OrderStatus table for history
 * - Staff actions (pickup, inspection, delivery) are tracked in OrderAction table
 * - Photos can be attached at different stages (pickup, check, delivery) via OrderPhoto
 * - Transactions (payments) are linked to orders - can have down payment + full payment
 *
 * Workflow:
 * 1. Customer creates order (online or staff creates for offline)
 * 2. Payment processed (down payment or full)
 * 3. Shoes picked up (online) or received at store (offline)
 * 4. Inspection and assessment
 * 5. Cleaning process
 * 6. Delivery (online) or customer pickup notification (offline)
 * 7. Order completion
 */
export default class Order extends BaseModel {
  static table = Tables.ORDERS

  @column({ isPrimary: true })
  declare id: string

  /**
   * Unique order identifier
   * Format: ORD{YY}{MM}{DD}-{NNN}
   * Example: ORD250115-001 (Jan 15, 2025, first order of the day)
   * Auto-generated in beforeCreate hook
   */
  @column()
  declare number: string

  /**
   * Customer who placed the order
   * For offline customers without account, userId use staff's ID who created the order
   */
  @column()
  declare userId: string

  /**
   * Address for ALL orders (REQUIRED - non-nullable)
   *
   * ONLINE orders:
   * - Points to customer's real delivery/pickup address
   * - Address must be within service area (validated before order creation)
   * - Contains customer's name, phone, and coordinates for delivery
   *
   * offline orders:
   * - Points to address with STORE's coordinates (latitude/longitude)
   * - Contains CUSTOMER's name and phone (for pickup notification)
   * - Street is store's address
   * - Radius is 0 (customer is at the store)
   *
   * This approach eliminates nullable foreign keys while preserving customer contact info
   * offline customers can later add real addresses for online delivery (hasMany relationship)
   */
  @column()
  declare addressId: string

  /**
   * Scheduled date for service completion
   * For online orders: when delivery will be attempted
   * For offline orders: when customer should come pick up
   */
  @column()
  declare date: Date

  /**
   * Order type determines workflow:
   * - 'online': Requires pickup from address, delivery back to address
   * - 'offline': Customer drops off and picks up at store
   *
   * NOTE: Both types still go through same processing stages
   * Only difference is pickup/delivery vs store drop-off/pickup
   */
  @column()
  declare type: 'online' | 'offline'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Customer relationship
   */
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  /**
   * Address relationship (always present for all orders)
   * - Online orders: Customer's delivery address
   * - offline orders: Store location with customer contact info
   */
  @belongsTo(() => Address, {
    foreignKey: 'addressId',
  })
  declare address: BelongsTo<typeof Address>

  /**
   * Payment transactions for this order
   * Can have multiple: down_payment and full_payment
   * Each transaction has items (shoe + service combinations)
   */
  @hasMany(() => Transaction, {
    foreignKey: 'orderId',
  })
  declare transactions: HasMany<typeof Transaction>

  /**
   * Shoes included in this order
   * Customer can submit multiple shoes in one order
   * Each shoe can have different services applied
   */
  @hasMany(() => Shoe, {
    foreignKey: 'orderId',
  })
  declare shoes: HasMany<typeof Shoe>

  /**
   * Photos taken during order processing
   * Staged at: pickup, inspection (check), delivery
   * Used for quality control and customer transparency
   */
  @hasMany(() => OrderPhoto, {
    foreignKey: 'orderId',
  })
  declare photos: HasMany<typeof OrderPhoto>

  /**
   * Status history for this order
   * Tracks all status changes over time
   * Current status = most recent record
   */
  @hasMany(() => OrderStatus, {
    foreignKey: 'orderId',
  })
  declare statuses: HasMany<typeof OrderStatus>

  /**
   * Staff actions performed on this order
   * Tracks: attempts, completions, releases for each stage
   * Used to enforce single-staff-per-stage workflow
   */
  @hasMany(() => OrderAction, {
    foreignKey: 'orderId',
  })
  declare actions: HasMany<typeof OrderAction>

  /**
   * Auto-generate order number before creating record
   */
  @beforeCreate()
  static async generateNumber(order: Order) {
    order.number = await this.generateOrderNumber()
  }

  /**
   * Generate unique order number with format ORD{YY}{MM}{DD}-{NNN}
   *
   * Business Logic:
   * - YY = Last 2 digits of year
   * - MM = Zero-padded month (01-12)
   * - DD = Zero-padded day (01-31)
   * - NNN = Sequential number starting from 001 each day
   *
   * Example: ORD250115-001 = First order on January 15, 2025
   */
  private static async generateOrderNumber() {
    const { day, year, month } = this.getCurrentYearMonth()
    const prefix = `ORD${year}${month}${day}`
    const lastOrder = await this.getLastOrderForDay(prefix)
    const nextIncrement = this.calculateNextIncrement(lastOrder)
    const identifier = this.formatIdentifier(nextIncrement)

    return `${prefix}-${identifier}`
  }

  /**
   * Get current date components formatted for order number
   */
  private static getCurrentYearMonth() {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const year = today.getFullYear().toString().slice(-2) // Last 2 digits
    const month = (today.getMonth() + 1).toString().padStart(2, '0') // Zero-padded month

    return { year, month, day }
  }

  /**
   * Find the last order for current day
   * Used to determine next sequential number
   */
  private static async getLastOrderForDay(prefix: string) {
    return await Order.query()
      .where('number', 'like', `${prefix}-%`)
      .orderBy('number', 'desc')
      .first()
  }

  /**
   * Calculate next increment number
   * If no orders exist for today, starts at 1
   * Otherwise increments from last order
   */
  private static calculateNextIncrement(lastOrder: Order | null) {
    if (!lastOrder) return 1

    const lastNumber = lastOrder.number.split('-')[1]
    return Number.parseInt(lastNumber) + 1
  }

  /**
   * Format increment as 3-digit identifier (001, 002, etc.)
   */
  private static formatIdentifier(increment: number) {
    return increment.toString().padStart(3, '0')
  }
}
