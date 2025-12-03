import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { computed, belongsTo, column, hasMany, BaseModel } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Role from './role.js'
import Address from './address.js'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import { DateTime } from 'luxon'
import Roles from '#enums/role_enum'
import PasswordResetToken from './password_reset_token.js'
import Order from './order.js'
import Review from './review.js'
import Notification from './notification.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare roleId: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @computed()
  get isAdmin() {
    return this.roleId === Roles.ADMIN
  }

  @computed()
  get isStaff() {
    return this.roleId === Roles.STAFF
  }

  @computed()
  get isUser() {
    return this.roleId === Roles.USER
  }

  @belongsTo(() => Role, {
    foreignKey: 'roleId',
  })
  declare role: BelongsTo<typeof Role>

  @hasMany(() => PasswordResetToken, {
    foreignKey: 'userId',
  })
  declare resetPasswordTokens: HasMany<typeof PasswordResetToken>

  @hasMany(() => Address, {
    foreignKey: 'userId',
  })
  declare addresses: HasMany<typeof Address>

  @hasMany(() => Order, {
    foreignKey: 'userId',
  })
  declare orders: HasMany<typeof Order>

  @hasMany(() => Review, {
    foreignKey: 'userId',
  })
  declare reviews: HasMany<typeof Review>

  @hasMany(() => Notification, {
    foreignKey: 'userId',
  })
  declare notifications: HasMany<typeof Notification>

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
}
