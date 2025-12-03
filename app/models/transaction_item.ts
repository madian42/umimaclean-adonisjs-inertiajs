import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Transaction from './transaction.js'
import Shoe from './shoe.js'
import Service from './service.js'

export default class TransactionItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare transactionId: string

  @column()
  declare shoeId: string

  @column()
  declare serviceId: string

  @column()
  declare itemPrice: number

  @column()
  declare subtotal: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction, {
    foreignKey: 'transactionId',
  })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => Shoe, {
    foreignKey: 'shoeId',
  })
  declare shoe: BelongsTo<typeof Shoe>

  @belongsTo(() => Service, {
    foreignKey: 'serviceId',
  })
  declare service: BelongsTo<typeof Service>
}
