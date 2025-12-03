import OrderStatuses from '#enums/order_status_enum'
import Roles from '#enums/role_enum'
import Address from '#models/address'
import Order from '#models/order'
import OrderStatus from '#models/order_status'
import User from '#models/user'
import { createofflineAddress } from '#utils/walk_in_address'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class OrderSeeder extends BaseSeeder {
  async run() {
    // Find a user with roleId = USER (customer for orders)
    const customer = await User.query().where('roleId', Roles.USER).first()
    if (!customer) {
      throw new Error('Seeder requires at least one user with roleId = USER')
    }
    const customerId = customer.id

    // Find a staff member for offline orders
    const staff = await User.query().where('roleId', Roles.STAFF).first()
    if (!staff) {
      throw new Error('Seeder requires at least one user with roleId = STAFF')
    }
    const staffId = staff.id

    // Find or create an address for the online orders
    let address = await Address.query().where('userId', customerId).first()
    if (!address) {
      // If no address exists, create a default one
      address = await Address.create({
        userId: customerId,
        name: 'Home Address',
        phone: '1234567890',
        street: '123 Main St, Sample City',
        latitude: -6.9555305,
        longitude: 107.6540353,
        radius: 15.5,
        note: null,
      })
    }
    const addressId = address.id

    // Define statuses to seed
    const statusesToSeed = [
      OrderStatuses.WAITING_DEPOSIT,
      OrderStatuses.PICKUP_SCHEDULED,
      OrderStatuses.PICKUP_PROGRESS,
      OrderStatuses.INSPECTION,
    ]

    // Create online orders for each status (4 online orders per status)
    let dayCounter = 1
    for (const status of statusesToSeed) {
      for (let i = 1; i <= 4; i++) {
        const date = new Date(2025, 0, dayCounter) // January 2025
        const order = await Order.create({
          userId: customerId,
          addressId: addressId,
          date: date,
          type: 'online',
        })

        await OrderStatus.create({
          orderId: order.id,
          name: status,
        })

        dayCounter++
      }
    }

    // Create offline orders (1 offline per status, creates address with store location)
    for (const status of statusesToSeed) {
      const date = new Date(2025, 0, dayCounter)

      // Create offline address with store location and customer contact info
      // Address belongs to STAFF, order belongs to CUSTOMER
      const offlineAddress = await createofflineAddress(
        staffId, // Address belongs to store staff
        'John Doe', // Customer name
        '+62-812-3456-7890', // Customer phone for pickup notification
        'offline order - seeded data'
      )

      const order = await Order.create({
        userId: customerId, // Order belongs to customer
        addressId: offlineAddress.id, // Address belongs to staff
        date: date,
        type: 'offline',
      })

      await OrderStatus.create({
        orderId: order.id,
        name: status,
      })

      dayCounter++
    }
  }
}
