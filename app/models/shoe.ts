import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import Tables from '#enums/table_enum'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Order from './order.js'
import TransactionItem from './transaction_item.js'

/**
 * Shoe submitted for cleaning in an order.
 * Captures brand, size, type, material, category, and condition.
 * Different materials require different cleaning methods.
 */
export default class Shoe extends BaseModel {
  static table = Tables.SHOES

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare brand: string

  @column()
  declare size: number

  @column()
  declare type: string

  /**
   * Different materials require different cleaning techniques.
   */
  @column()
  declare material: string

  @column()
  declare category: string

  /**
   * Documented for pricing and dispute prevention.
   */
  @column()
  declare condition: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  /**
   * Links shoe to services and pricing.
   */
  @hasMany(() => TransactionItem, {
    foreignKey: 'shoeId',
  })
  declare transactionItems: HasMany<typeof TransactionItem>
}
