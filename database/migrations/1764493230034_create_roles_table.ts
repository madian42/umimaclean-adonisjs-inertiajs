import Roles from '#enums/role_enum'
import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = Tables.ROLES

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name', 50).notNullable()
      table.string('description', 255).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.defer(async (db) => {
      await db.table(this.tableName).insert([
        {
          id: Roles.ADMIN,
          name: 'Admin',
          description: 'Super User with full access',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Roles.STAFF,
          name: 'Staff',
          description: 'Staff User with limited access',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Roles.USER,
          name: 'User',
          description: 'Authenticated User',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
