import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Order from './order.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tables from '#enums/table_enum'
import OrderStatuses from '#enums/order_status_enum'

/**
 * Status history for an order.
 * Latest record represents current state. Immutable audit trail.
 */
export default class OrderStatus extends BaseModel {
  static table = Tables.ORDER_STATUSES

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: string

  @column()
  declare name: OrderStatuses

  @column()
  declare note: string | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>
}
