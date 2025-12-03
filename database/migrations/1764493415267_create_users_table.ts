import Roles from '#enums/role_enum'
import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable(Tables.USERS, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable(Tables.ROLES)
        .onDelete('CASCADE')
        .defaultTo(Roles.USER)

      table.string('name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable(Tables.ADDRESSES, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').notNullable().references('id').inTable(Tables.USERS).onDelete('CASCADE')

      table.string('name').notNullable()
      table.string('phone', 15).notNullable()
      table.string('street').notNullable()
      table.decimal('latitude', 10, 6).notNullable()
      table.decimal('longitude', 10, 6).notNullable()
      table.decimal('radius', 7, 2).notNullable()
      table.string('note').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(Tables.USERS)
    this.schema.dropTable(Tables.ADDRESSES)
  }
}
