import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tables from '#enums/table_enum'
import Order from './order.js'
import TransactionItem from './transaction_item.js'

/**
 * Payment transaction for an order.
 * Each order has down_payment and full_payment transactions.
 * Integrated with Midtrans payment gateway.
 */
export default class Transaction extends BaseModel {
  static table = Tables.TRANSACTIONS

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare status: string

  @column()
  declare type: 'down_payment' | 'full_payment'

  @column()
  declare amount: number

  @column()
  declare midtransStatus: string

  @column()
  declare midtransId: string

  @column()
  declare midtransQrCode: string

  @column.dateTime()
  declare expiredAt: DateTime

  @column.dateTime()
  declare paymentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  /**
   * Transaction line items (shoe + service + price).
   */
  @hasMany(() => TransactionItem, {
    foreignKey: 'transactionId',
  })
  declare items: HasMany<typeof TransactionItem>
}
