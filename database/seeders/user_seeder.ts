import Roles from '#enums/role_enum'
import Address from '#models/address'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class UserSeeder extends BaseSeeder {
  async run() {
    const user = await User.createMany([
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

    await Address.create({
      userId: user[1].id,
      name: 'UmimaClean Store',
      phone: '085157900974',
      street: 'Jl. Margacinta No.132, Margasari, Kec. Buahbatu, Kota Bandung, Jawa Barat 40286',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 0,
      note: 'Lokasi toko UmimaClean untuk pesanan offline',
    })
  }
}
