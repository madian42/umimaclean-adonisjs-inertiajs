import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.js'

import { DateTime } from 'luxon'
import Tables from '#enums/table_enum'
import OrderPhotoStages from '#enums/order_photo_stage_enum'
import User from './user.js'

/**
 * Photos taken during order processing (pickup, check, delivery).
 * Linked to staff for accountability. Used for quality control and transparency.
 */
export default class OrderPhoto extends BaseModel {
  static table = Tables.ORDER_PHOTOS

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare adminId: string

  @column()
  declare stage: OrderPhotoStages

  @column()
  declare path: string

  @column()
  declare note: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, {
    foreignKey: 'adminId',
  })
  declare admin: BelongsTo<typeof User>
}
