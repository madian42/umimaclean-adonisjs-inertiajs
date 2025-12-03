import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import { randomBytes } from 'node:crypto'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Tables from '#enums/table_enum'

export default class PasswordResetToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: string

  @column()
  declare token: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  public static async generateToken(user: User, trx: TransactionClientContract) {
    const token = randomBytes(64).toString('hex').slice(0, 64)
    const expiresAt = DateTime.now().plus({ hours: 1 })

    // Remove existing tokens for the user using the provided transaction
    await this.deleteTokens(user, trx)

    // Insert a new token row within the transaction. We use the transaction's
    // query builder directly to guarantee the operations are part of the same
    // transaction managed by the caller.
    await trx.table(Tables.PASSWORD_RESET_TOKENS).insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toSQL(),
      created_at: DateTime.now().toSQL(),
      updated_at: DateTime.now().toSQL(),
    })

    return { token, expiresAt }
  }

  public static async getToken(token: string) {
    const resetToken = await PasswordResetToken.query()
      .where('token', token)
      .andWhere('expires_at', '>', DateTime.now().toSQL())
      .first()
    return resetToken
  }

  public static async deleteTokens(user: User, trx: TransactionClientContract) {
    await trx.from(Tables.PASSWORD_RESET_TOKENS).where('user_id', user.id).delete()
  }
}
