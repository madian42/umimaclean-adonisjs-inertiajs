import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.js'

import { DateTime } from 'luxon'
import Tables from '#enums/table_enum'
import OrderPhotoStages from '#enums/order_photo_stage_enum'
import User from './user.js'

/**
 * OrderPhoto Model
 *
 * Stores photos taken during different stages of order processing.
 * Provides visual documentation and evidence of shoe condition at key points.
 *
 * Business Logic:
 * - Photos are required at three stages: PICKUP, CHECK (inspection), and DELIVERY
 * - Each photo is linked to a staff member (accountability)
 * - Photos can have optional notes for additional context
 * - Multiple photos can be taken at each stage
 * - Photos serve multiple purposes:
 *   1. Quality control - document shoe condition
 *   2. Customer transparency - show before/after
 *   3. Dispute resolution - evidence if issues arise
 *   4. Training - examples of different shoe conditions
 *
 * Photo Stages:
 * 1. PICKUP - Photos when shoes are received
 *    - Online orders: when picked up from customer's address
 *    - offline orders: when customer drops off at store
 *    - Documents initial condition, any existing damage
 *
 * 2. CHECK - Photos during inspection/assessment
 *    - After shoes are received and being inspected
 *    - Documents stains, damage, special conditions found
 *    - Used to determine pricing and service requirements
 *
 * 3. DELIVERY - Photos when shoes are returned to customer
 *    - Online orders: when delivered back to customer
 *    - offline orders: when customer picks up from store
 *    - Documents final cleaned condition
 *    - Proof of successful service completion
 *
 * Usage Example:
 * ```typescript
 * // Staff uploads pickup photo
 * const photo = await OrderPhoto.create({
 *   orderId: order.id,
 *   adminId: staff.id,
 *   stage: OrderPhotoStages.PICKUP,
 *   path: '/uploads/orders/abc123/pickup-1.jpg',
 *   note: 'Heavy staining on toe area'
 * })
 *
 * // Link photo to action
 * await OrderAction.create({
 *   orderId: order.id,
 *   adminId: staff.id,
 *   action: OrderActions.PICKUP,
 *   orderPhotoId: photo.id
 * })
 * ```
 */
export default class OrderPhoto extends BaseModel {
  static table = Tables.ORDER_PHOTOS

  @column({ isPrimary: true })
  declare id: string

  /**
   * Reference to the order this photo belongs to
   */
  @column()
  declare orderId: string

  /**
   * Staff member who uploaded this photo
   * Must be a user with role STAFF or ADMIN
   * Provides accountability for photo documentation
   */
  @column()
  declare adminId: string

  /**
   * Stage at which this photo was taken
   * Values: 'pickup', 'check', 'delivery'
   * See OrderPhotoStages enum for all possible values
   */
  @column()
  declare stage: OrderPhotoStages

  /**
   * File path where the photo is stored
   * Typically: /uploads/orders/{orderId}/{stage}-{timestamp}.jpg
   * Path is relative to storage root configured in application
   */
  @column()
  declare path: string

  /**
   * Optional note providing context about the photo
   * Examples:
   * - "Visible scuff marks on heel"
   * - "Deep stain requires special treatment"
   * - "Customer requested focus on logo area"
   * - "Before and after comparison"
   */
  @column()
  declare note: string | null

  /**
   * Timestamp when photo was uploaded
   * Used to track photo sequence at each stage
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /**
   * Timestamp when photo record was last updated
   * Typically only changes if note is modified
   */
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Order this photo belongs to
   */
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  /**
   * Staff member who uploaded this photo
   */
  @belongsTo(() => User, {
    foreignKey: 'adminId',
  })
  declare admin: BelongsTo<typeof User>
}
