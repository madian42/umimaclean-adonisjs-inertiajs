import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Order from './order.js'
import { DateTime } from 'luxon'
import Tables from '#enums/table_enum'
import OrderActions from '#enums/order_action_enum'
import User from './user.js'
import OrderPhoto from './order_photo.js'

/**
 * Staff actions on orders with stage locking.
 * Staff claims stage (ATTEMPT), completes (action), or releases.
 * Prevents multiple staff working on same stage simultaneously.
 */
export default class OrderAction extends BaseModel {
  static table = Tables.ORDER_ACTIONS

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare orderPhotoId: string | null

  @column()
  declare adminId: string

  @column()
  declare action: OrderActions

  @column()
  declare note: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @hasOne(() => OrderPhoto, {
    foreignKey: 'orderPhotoId',
  })
  declare photo: HasOne<typeof OrderPhoto>

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, {
    foreignKey: 'adminId',
  })
  declare admin: BelongsTo<typeof User>
}
