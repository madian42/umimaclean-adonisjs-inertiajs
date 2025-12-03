import Roles from '#enums/role_enum'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class UserSeeder extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        email: 'admin@repo.com',
        name: 'Administrador',
        password: 'wadaw123',
        roleId: Roles.ADMIN,
      },
      {
        email: 'staff@wada.com',
        name: 'Staff Member',
        password: 'wadaw123',
        roleId: Roles.STAFF,
      },
      {
        email: 'saddam@wada.com',
        name: 'Regular User',
        password: 'wadaw123',
        roleId: Roles.USER,
      },
    ])
  }
}
