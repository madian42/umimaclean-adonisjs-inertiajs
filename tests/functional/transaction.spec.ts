import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Roles from '#enums/role_enum'
import Order from '#models/order'
import Transaction from '#models/transaction'
import TransactionStatuses from '#enums/transaction_status_enum'
import Address from '#models/address'
import OrderStatus from '#models/order_status'
import OrderStatuses from '#enums/order_status_enum'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'

test.group('Transactions: payment page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /transactions/down-payment/:orderNumber renders transactions/down-payment with latest transaction', async ({
    client,
  }) => {
    const user = await User.create({
      email: 'txn-user@example.com',
      name: 'Txn User',
      password: 'secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: user.id,
      name: 'John',
      phone: '62811',
      street: 'Street',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 10,
      note: null,
    })
    const order = await Order.create({
      userId: user.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    await OrderStatus.create({
      orderId: order.id,
      name: OrderStatuses.WAITING_DEPOSIT,
    })
    await Transaction.create({
      orderId: order.id,
      amount: 12345,
      status: TransactionStatuses.PENDING,
      type: 'down_payment',
      midtransStatus: TransactionStatuses.PENDING,
      midtransId: randomUUID(),
      midtransQrCode: 'random-qrcode-data',
      expiredAt: DateTime.now().plus({ minutes: 15 }),
    })

    const response = await client
      .get(`/transactions/down-payment/${order.number}`)
      .loginAs(user)
      .withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('transaction/down-payment')
  })

  test('GET /transactions/down-payment/:orderNumber redirects when order not found', async ({
    client,
  }) => {
    const user = await User.create({
      email: 'txn-notfound@example.com',
      name: 'Txn User',
      password: 'secret123',
      roleId: Roles.USER,
    })

    const response = await client.get('/transactions/down-payment/ORD000000').loginAs(user)
    response.assertRedirectsTo('/orders')
  })

  test('GET /transactions/down-payment/:orderNumber redirects when order does not belong to user', async ({
    client,
  }) => {
    const user1 = await User.create({
      email: 'txn-user1@example.com',
      name: 'Txn User 1',
      password: 'secret123',
      roleId: Roles.USER,
    })
    const user2 = await User.create({
      email: 'txn-user2@example.com',
      name: 'Txn User 2',
      password: 'secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: user1.id,
      name: 'John',
      phone: '62811',
      street: 'Street',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 10,
      note: null,
    })
    const order = await Order.create({
      userId: user1.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })

    const response = await client.get(`/transactions/down-payment/${order.number}`).loginAs(user2)
    response.assertRedirectsTo('/orders')
  })
})

test.group('Transactions: payment creation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /transactions/down-payment/:orderNumber creates payment transaction', async ({
    client,
  }) => {
    const user = await User.create({
      email: 'txn-create@example.com',
      name: 'Txn User',
      password: 'secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: user.id,
      name: 'John',
      phone: '62811',
      street: 'Street',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 10,
      note: null,
    })
    const order = await Order.create({
      userId: user.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    await OrderStatus.create({
      orderId: order.id,
      name: OrderStatuses.WAITING_DEPOSIT,
    })

    const response = await client
      .post(`/transactions/down-payment/${order.number}`)
      .header('referer', `/transactions/down-payment/${order.number}`)
      .loginAs(user)
      .withCsrfToken()
      .withInertia()

    // Should redirect to payment page
    response.assertRedirectsTo(`/transactions/down-payment/${order.number}`)
  })
})

test.group('Transactions: webhook and callbacks', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /transaction/callback handles midtrans notification', async ({ client }) => {
    const user = await User.create({
      email: 'txn-webhook@example.com',
      name: 'Txn User',
      password: 'secret123',
      roleId: Roles.USER,
    })
    const address = await Address.create({
      userId: user.id,
      name: 'John',
      phone: '62811',
      street: 'Street',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 10,
      note: null,
    })
    const order = await Order.create({
      userId: user.id,
      addressId: address.id,
      date: new Date(),
      type: 'online',
    })
    const transaction = await Transaction.create({
      orderId: order.id,
      amount: 12345,
      status: TransactionStatuses.PENDING,
      type: 'down_payment',
      midtransStatus: TransactionStatuses.PENDING,
      midtransId: randomUUID(),
      midtransQrCode: 'random-qrcode-data',
      expiredAt: DateTime.now().plus({ minutes: 15 }),
    })

    const response = await client.post('/transaction/callback').form({
      order_id: transaction.midtransId,
      transaction_status: 'settlement',
      fraud_status: 'accept',
    })

    response.assertStatus(200)
  })
})
