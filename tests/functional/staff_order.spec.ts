import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Roles from '#enums/role_enum'
import Address from '#models/address'
import Order from '#models/order'
import OrderStatus from '#models/order_status'
import OrderStatuses from '#enums/order_status_enum'
import Shoe from '#models/shoe'
import Service from '#models/service'
import TransactionItem from '#models/transaction_item'

test.group('Staff: Order management', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /staff/orders/:id shows order details for staff', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-order-view@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    const customer = await User.create({
      email: 'customer-order-view@example.com',
      name: 'Customer',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: customer.id,
      name: 'John Doe',
      phone: '628123456789',
      street: 'Jl. Test No. 123',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 100,
      note: null,
    })
    const order = await Order.create({
      userId: customer.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    await OrderStatus.create({
      orderId: order.id,
      name: OrderStatuses.WAITING_DEPOSIT,
    })

    const response = await client.get(`/staff/orders/${order.id}`).loginAs(staff).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/order/show')
  })

  test('Regular users cannot access staff order pages', async ({ client, assert }) => {
    const user = await User.create({
      email: 'regular-user@example.com',
      name: 'User',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const customer = await User.create({
      email: 'customer-order@example.com',
      name: 'Customer',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: customer.id,
      name: 'John Doe',
      phone: '628123456789',
      street: 'Jl. Test No. 123',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 100,
      note: null,
    })
    const order = await Order.create({
      userId: customer.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })

    const response = await client.get(`/staff/orders/${order.id}`).loginAs(user)

    response.assertStatus(302)
    assert.equal(response.header('location'), '/order')
  })
})

test.group('Staff: Inspection workflow', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /staff/orders/:id/inspection shows inspection form', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-inspect@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    const customer = await User.create({
      email: 'customer-inspect@example.com',
      name: 'Customer',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: customer.id,
      name: 'John Doe',
      phone: '628123456789',
      street: 'Jl. Test No. 123',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 100,
      note: null,
    })
    const order = await Order.create({
      userId: customer.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    await OrderStatus.create({
      orderId: order.id,
      name: OrderStatuses.INSPECTION,
    })

    const response = await client
      .get(`/staff/orders/${order.id}/inspection`)
      .loginAs(staff)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/order/inspection')
  })

  test('POST /staff/orders/:id/inspection/complete completes inspection', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-complete@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    const customer = await User.create({
      email: 'customer-complete@example.com',
      name: 'Customer',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: customer.id,
      name: 'John Doe',
      phone: '628123456789',
      street: 'Jl. Test No. 123',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 100,
      note: null,
    })
    const order = await Order.create({
      userId: customer.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    await OrderStatus.create({
      orderId: order.id,
      name: OrderStatuses.INSPECTION,
    })

    // Create services
    const service1 = await Service.create({
      name: 'Deep Clean',
      price: 50000,
    })
    const service2 = await Service.create({
      name: 'Repaint',
      price: 75000,
    })

    const response = await client
      .post(`/staff/orders/${order.id}/inspection/complete`)
      .loginAs(staff)
      .form({
        shoes: JSON.stringify([
          {
            brand: 'Nike',
            color: 'White',
            services: [service1.id, service2.id],
          },
          {
            brand: 'Adidas',
            color: 'Black',
            services: [service1.id],
          },
        ]),
      })
      .withCsrfToken()

    response.assertRedirectsTo('/dashboard')
  })

  test('POST /staff/orders/:id/inspection/complete fails with invalid shoe data', async ({
    client,
  }) => {
    const staff = await User.create({
      email: 'staff-invalid@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    const customer = await User.create({
      email: 'customer-invalid@example.com',
      name: 'Customer',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: customer.id,
      name: 'John Doe',
      phone: '628123456789',
      street: 'Jl. Test No. 123',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 100,
      note: null,
    })
    const order = await Order.create({
      userId: customer.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    await OrderStatus.create({
      orderId: order.id,
      name: OrderStatuses.INSPECTION,
    })

    const response = await client
      .post(`/staff/orders/${order.id}/inspection/complete`)
      .loginAs(staff)
      .form({
        shoes: 'invalid-json',
      })
      .withCsrfToken()

    response.assertStatus([302, 422])
  })
})

test.group('Staff: offline order creation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /staff/orders/offline/create shows offline order form', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-offline@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })

    const response = await client.get('/staff/orders/offline/create').loginAs(staff).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/order/offline/create')
  })

  test('POST /staff/orders/offline creates offline order', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-create-offline@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })

    const response = await client
      .post('/staff/orders/offline')
      .loginAs(staff)
      .form({
        name: 'offline Customer',
        phone: '628123456789',
        date: '2025-01-15',
      })
      .withCsrfToken()
      .withInertia()

    response.assertStatus([200, 302])
  })

  test('POST /staff/orders/offline fails with invalid phone', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-invalid-phone@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })

    const response = await client
      .post('/staff/orders/offline')
      .loginAs(staff)
      .header('referer', '/staff/orders/offline/create')
      .form({
        name: 'offline Customer',
        phone: 'invalid-phone',
        date: '2025-01-15',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          phone: 'Nomor telepon hanya boleh berisi angka',
        },
      },
    })
  })

  test('POST /staff/orders/offline fails with empty name', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-empty-name@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })

    const response = await client
      .post('/staff/orders/offline')
      .loginAs(staff)
      .header('referer', '/staff/orders/offline/create')
      .form({
        name: '',
        phone: '628123456789',
        date: '2025-01-15',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          name: 'Nama harus diisi',
        },
      },
    })
  })
})

test.group('Staff: Order status updates', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Staff can update order status', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-status@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    const customer = await User.create({
      email: 'customer-status@example.com',
      name: 'Customer',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: customer.id,
      name: 'John Doe',
      phone: '628123456789',
      street: 'Jl. Test No. 123',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 100,
      note: null,
    })
    const order = await Order.create({
      userId: customer.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    await OrderStatus.create({
      orderId: order.id,
      name: OrderStatuses.WAITING_DEPOSIT,
    })

    const response = await client
      .post(`/staff/orders/${order.id}/status`)
      .loginAs(staff)
      .form({
        status: OrderStatuses.IN_PROCESS,
        note: 'Starting cleaning process',
      })
      .withCsrfToken()

    response.assertStatus([200, 302])
  })

  test('Staff can cancel order with reason', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-cancel@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    const customer = await User.create({
      email: 'customer-cancel@example.com',
      name: 'Customer',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: customer.id,
      name: 'John Doe',
      phone: '628123456789',
      street: 'Jl. Test No. 123',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 100,
      note: null,
    })
    const order = await Order.create({
      userId: customer.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    await OrderStatus.create({
      orderId: order.id,
      name: OrderStatuses.WAITING_DEPOSIT,
    })

    const response = await client
      .post(`/staff/orders/${order.id}/cancel`)
      .loginAs(staff)
      .form({
        note: 'Customer requested cancellation',
      })
      .withCsrfToken()

    response.assertStatus([200, 302])
  })
})

test.group('Staff: Shoe and service management', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Staff can view shoes for an order', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-shoes@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    const customer = await User.create({
      email: 'customer-shoes@example.com',
      name: 'Customer',
      password: 'Secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: customer.id,
      name: 'John Doe',
      phone: '628123456789',
      street: 'Jl. Test No. 123',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 100,
      note: null,
    })
    const order = await Order.create({
      userId: customer.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    const shoe = await Shoe.create({
      orderId: order.id,
      brand: 'Nike',
      color: 'White',
    })
    const service = await Service.create({
      name: 'Deep Clean',
      price: 50000,
    })
    await TransactionItem.create({
      shoeId: shoe.id,
      serviceId: service.id,
    })

    const response = await client.get(`/staff/orders/${order.id}`).loginAs(staff).withInertia()

    response.assertStatus(200)
  })

  test('GET /staff/services lists all available services', async ({ client }) => {
    const staff = await User.create({
      email: 'staff-services@example.com',
      name: 'Staff',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    await Service.create({
      name: 'Deep Clean',
      price: 50000,
    })
    await Service.create({
      name: 'Repaint',
      price: 75000,
    })

    const response = await client.get('/staff/services').loginAs(staff).withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('staff/service/index')
  })
})
