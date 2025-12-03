import Tables from '#enums/table_enum'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import TransactionItem from './transaction_item.js'

export default class Service extends BaseModel {
  static table = Tables.SERVICES

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare price: number

  @column()
  declare type: 'primary' | 'additional' | 'start_from'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => TransactionItem, {
    foreignKey: 'serviceId',
  })
  declare transactionItems: HasMany<typeof TransactionItem>
}
