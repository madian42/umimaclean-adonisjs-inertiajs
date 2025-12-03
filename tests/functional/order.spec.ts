import { test } from '@japa/runner'
import Order from '#models/order'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser, createAddressFor, createOrderFor } from '../utils/test_helpers.js'

test.group('Orders (user): GET pages and flows', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /order renders user/order/create with address', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)

    const response = await client.get('/order').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/create')
    response.assertInertiaPropsContains({
      addressId: address.id,
    })
  })

  test('GET /order renders user/order/create with no address', async ({ client }) => {
    const user = await createUser()

    const response = await client.get('/order').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/create')
  })

  test('POST /order creates order and redirects to orders.show', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)

    const response = await client
      .post('/order')
      .loginAs(user)
      .header('referer', '/order')
      .form({
        addressId: address.id,
        date: '2025-01-01',
      })
      .withCsrfToken()
      .withInertia()

    const created = await Order.query().where('user_id', user.id).first()
    response.assertRedirectsTo(`/orders/${created!.number}`)
  })

  test('GET /orders renders user/order/index', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)
    await createOrderFor(user.id, { addressId: address.id })

    const response = await client.get('/orders').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/index')
  })

  test('GET /orders/:number renders user/order/show for owned order', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)
    const order = await createOrderFor(user.id, { addressId: address.id })

    const response = await client.get(`/orders/${order.number}`).loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/show')
  })

  test('GET /orders/:number redirects to /orders when not found or not owned', async ({
    client,
  }) => {
    const user = await createUser()

    const response = await client.get(`/orders/ORD0000`).loginAs(user).withInertia()
    response.assertRedirectsTo('/orders')
  })

  test('GET /orders/:number/status renders user/order/status for owned order', async ({
    client,
  }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)
    const order = await createOrderFor(user.id, { addressId: address.id })

    const response = await client.get(`/orders/${order.number}/status`).loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/status')
  })
})

test.group('Orders (user): validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /order fails when addressId is missing', async ({ client }) => {
    const user = await createUser()
    await createAddressFor(user.id)

    const response = await client
      .post('/order')
      .loginAs(user)
      .header('referer', '/order')
      .form({
        date: '2025-01-01',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { addressId: 'ID Alamat harus diisi' } },
    })
  })

  test('POST /order fails when addressId is not a valid UUID', async ({ client }) => {
    const user = await createUser()
    await createAddressFor(user.id)

    const response = await client
      .post('/order')
      .loginAs(user)
      .header('referer', '/order')
      .form({
        addressId: 'not-a-uuid',
        date: '2025-01-01',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { addressId: 'ID Alamat harus berupa UUID yang valid' } },
    })
  })

  test('POST /order fails when date is missing', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)

    const response = await client
      .post('/order')
      .loginAs(user)
      .header('referer', '/order')
      .form({
        addressId: address.id,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { date: 'Tanggal harus diisi' } },
    })
  })

  test('POST /order fails when date is invalid format', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)

    const response = await client
      .post('/order')
      .loginAs(user)
      .header('referer', '/order')
      .form({
        addressId: address.id,
        date: 'not-a-date',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { date: 'Tanggal harus berupa tanggal yang valid' } },
    })
  })

  test('POST /order fails when address does not belong to user', async ({ client }) => {
    const user = await createUser()
    await createAddressFor(user.id)
    const otherUser = await createUser({ email: 'other@example.com' })
    const otherAddress = await createAddressFor(otherUser.id)

    const response = await client
      .post('/order')
      .loginAs(user)
      .header('referer', '/order')
      .form({
        addressId: otherAddress.id,
        date: '2025-01-01',
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/order')
  })
})

test.group('Orders (user): search and filters', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /orders filters by status=active shows only active orders', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)
    await createOrderFor(user.id, { addressId: address.id })

    const response = await client.get('/orders?status=active').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/index')
  })

  test('GET /orders filters by status=completed shows only completed orders', async ({
    client,
  }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)
    await createOrderFor(user.id, { addressId: address.id })

    const response = await client.get('/orders?status=completed').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/index')
  })

  test('GET /orders supports search query', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)
    const order = await createOrderFor(user.id, { addressId: address.id })

    const response = await client.get(`/orders?search=${order.number}`).loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/index')
  })

  test('GET /orders supports pagination', async ({ client }) => {
    const user = await createUser()
    const address = await createAddressFor(user.id)
    await createOrderFor(user.id, { addressId: address.id })

    const response = await client.get('/orders?page=1').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/order/index')
  })
})
