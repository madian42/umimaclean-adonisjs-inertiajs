import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Order from './order.js'
import { DateTime } from 'luxon'
import Tables from '#enums/table_enum'
import OrderActions from '#enums/order_action_enum'
import User from './user.js'
import OrderPhoto from './order_photo.js'

/**
 * OrderAction Model
 *
 * Tracks staff actions performed on orders during processing stages.
 * Implements a locking mechanism to prevent multiple staff from working on the same stage simultaneously.
 *
 * Business Logic - Stage Locking Workflow:
 * 1. Staff "claims" a stage by creating an ATTEMPT_* action
 * 2. Only that staff member can work on or complete that stage
 * 3. Staff completes the stage by creating the corresponding completion action (PICKUP, CHECK, DELIVERY)
 * 4. Staff can release the stage without completing via RELEASE_* action
 *
 * Action Types:
 * - ATTEMPT_PICKUP - Staff claims pickup task (online orders only)
 * - PICKUP - Staff successfully picked up shoes from customer
 * - RELEASE_PICKUP - Staff releases pickup task without completion
 *
 * - ATTEMPT_CHECK - Staff claims inspection task (all orders)
 * - CHECK - Staff completed inspection and assessment
 * - RELEASE_CHECK - Staff releases inspection task without completion
 *
 * - ATTEMPT_DELIVERY - Staff claims delivery task (all orders)
 * - DELIVERY - Staff successfully delivered shoes to customer (online) or customer picked up (offline)
 * - RELEASE_DELIVERY - Staff releases delivery task without completion
 *
 * Why This System Exists:
 * - Prevents confusion when multiple staff work simultaneously
 * - Ensures accountability (tracks who did what)
 * - Allows staff to "claim" work and prevent others from duplicating effort
 * - Provides audit trail of all actions taken on an order
 * - Used by StageMiddleware to enforce single-staff-per-stage rule
 *
 * Usage Example:
 * ```typescript
 * // Staff claims pickup stage
 * await OrderAction.create({
 *   orderId: order.id,
 *   adminId: staff.id,
 *   action: OrderActions.ATTEMPT_PICKUP,
 *   note: 'Starting pickup route'
 * })
 *
 * // Later, staff completes pickup
 * await OrderAction.create({
 *   orderId: order.id,
 *   adminId: staff.id,
 *   action: OrderActions.PICKUP,
 *   orderPhotoId: photo.id, // Reference to pickup photo
 *   note: 'Shoes collected successfully'
 * })
 * ```
 *
 * IMPORTANT: StageMiddleware checks for active ATTEMPT_* actions without corresponding
 * completion or release actions to determine if staff is locked to a stage.
 */
export default class OrderAction extends BaseModel {
  static table = Tables.ORDER_ACTIONS

  @column({ isPrimary: true })
  declare id: string

  /**
   * Reference to the order this action was performed on
   */
  @column()
  declare orderId: string

  /**
   * Optional reference to photo taken during this action
   * Typically set when completing stages (PICKUP, CHECK, DELIVERY)
   * NULL for ATTEMPT_* and RELEASE_* actions
   */
  @column()
  declare orderPhotoId: string | null

  /**
   * Staff member who performed this action
   * Must be a user with role STAFF or ADMIN
   */
  @column()
  declare adminId: string

  /**
   * The action performed
   * See OrderActions enum for all possible values
   */
  @column()
  declare action: OrderActions

  /**
   * Optional note providing context for this action
   * Examples:
   * - "Customer not home, will retry tomorrow"
   * - "Found additional damage during inspection"
   * - "Express service requested"
   */
  @column()
  declare note: string | null

  /**
   * Timestamp when this action was performed
   * Used to track action sequence and enforce workflow rules
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /**
   * Photo associated with this action (if any)
   * Photos are required for completion actions (PICKUP, CHECK, DELIVERY)
   */
  @hasOne(() => OrderPhoto, {
    foreignKey: 'orderPhotoId',
  })
  declare photo: HasOne<typeof OrderPhoto>

  /**
   * Order this action belongs to
   */
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  /**
   * Staff member who performed this action
   */
  @belongsTo(() => User, {
    foreignKey: 'adminId',
  })
  declare admin: BelongsTo<typeof User>
}
