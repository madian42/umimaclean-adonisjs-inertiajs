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
 * Shoe cleaning order - online (pickup/delivery) or offline (store drop-off).
 * All orders have address, unique number, status history, and linked transactions.
 */
export default class Order extends BaseModel {
  static table = Tables.ORDERS

  @column({ isPrimary: true })
  declare id: string

  /**
   * Format: ORD{YY}{MM}{DD}-{NNN}
   */
  @column()
  declare number: string

  @column()
  declare userId: string

  /**
   * Online: customer location. Offline: store location with customer contact.
   */
  @column()
  declare addressId: string

  @column()
  declare date: Date

  @column()
  declare type: 'online' | 'offline'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Address, {
    foreignKey: 'addressId',
  })
  declare address: BelongsTo<typeof Address>

  @hasMany(() => Transaction, {
    foreignKey: 'orderId',
  })
  declare transactions: HasMany<typeof Transaction>

  @hasMany(() => Shoe, {
    foreignKey: 'orderId',
  })
  declare shoes: HasMany<typeof Shoe>

  @hasMany(() => OrderPhoto, {
    foreignKey: 'orderId',
  })
  declare photos: HasMany<typeof OrderPhoto>

  @hasMany(() => OrderStatus, {
    foreignKey: 'orderId',
  })
  declare statuses: HasMany<typeof OrderStatus>

  @hasMany(() => OrderAction, {
    foreignKey: 'orderId',
  })
  declare actions: HasMany<typeof OrderAction>

  @beforeCreate()
  static async generateNumber(order: Order) {
    order.number = await this.generateOrderNumber()
  }

  /**
   * Generate unique order number: ORD{YY}{MM}{DD}-{NNN}
   */
  private static async generateOrderNumber() {
    const { day, year, month } = this.getCurrentYearMonth()
    const prefix = `ORD${year}${month}${day}`
    const lastOrder = await this.getLastOrderForDay(prefix)
    const nextIncrement = this.calculateNextIncrement(lastOrder)
    const identifier = this.formatIdentifier(nextIncrement)

    return `${prefix}-${identifier}`
  }

  private static getCurrentYearMonth() {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const year = today.getFullYear().toString().slice(-2)
    const month = (today.getMonth() + 1).toString().padStart(2, '0')

    return { year, month, day }
  }

  private static async getLastOrderForDay(prefix: string) {
    return await Order.query()
      .where('number', 'like', `${prefix}-%`)
      .orderBy('number', 'desc')
      .first()
  }

  private static calculateNextIncrement(lastOrder: Order | null) {
    if (!lastOrder) return 1

    const lastNumber = lastOrder.number.split('-')[1]
    return Number.parseInt(lastNumber) + 1
  }

  private static formatIdentifier(increment: number) {
    return increment.toString().padStart(3, '0')
  }
}
