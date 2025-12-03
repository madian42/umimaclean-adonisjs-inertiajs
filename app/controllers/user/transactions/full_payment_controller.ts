import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { createRequire } from 'node:module'
import Order from '#models/order'
import limiter from '@adonisjs/limiter/services/main'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'
import TransactionStatuses from '#enums/transaction_status_enum'
import { errors } from '@adonisjs/limiter'
import logger from '@adonisjs/core/services/logger'
import { transactionValidator } from '#validators/transaction_validator'
import MidtransStatuses from '#enums/midtrans_status'
import { MidtransQrisResponse } from '#types'

const require = createRequire(import.meta.url)
const midtransClient = require('midtrans-client')

export default class FullPaymentController {
  coreApi = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: env.get('MIDTRANS_SERVER_KEY'),
  })

  async index({ inertia, params, response, session, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get latest transaction for this order and type full_payment
    const transaction = await Transaction.query()
      .where('type', 'down_payment')
      .preload('order', (query) => {
        query.where('number', params.id).andWhere('user_id', user.id)
      })
      .preload('items')
      .orderBy('created_at', 'desc')
      .first()

    // Guard: Only allow viewing if there is an active (pending and not expired) transaction
    if (!transaction) {
      session.flash('general_errors', 'Tidak ada transaksi yang aktif')
      return response.redirect().toRoute('orders.show', { id: params.id })
    }

    const isExpired = this.isExpired(transaction.expiredAt)
    const isActive = transaction.status === TransactionStatuses.PENDING && !isExpired

    if (!isActive) {
      session.flash(
        'general_errors',
        isExpired ? 'Transaksi pembayaran telah kadaluarsa' : 'Transaksi tidak aktif'
      )
      return response.redirect().toRoute('orders.show', { id: params.id })
    }

    return inertia.render('transaction/full-payment', {
      transaction,
    })
  }

  async handle({ request, params, response, session, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(transactionValidator)

    const order = await Order.query()
      .where('id', params.id)
      .andWhere('user_id', user.id)
      .preload('address')
      .first()
    if (!order) {
      session.flash('general_errors', 'Pesanan tidak ditemukan')
      return response.redirect().back()
    }

    // Server-side guard: prevent starting new payment when active one exists or when previous one expired
    const latestTx = await Transaction.query()
      .where('order_id', order.id)
      .andWhere('type', 'full_payment')
      .orderBy('created_at', 'desc')
      .first()

    if (latestTx) {
      const isExpired = this.isExpired(latestTx.expiredAt)
      const isPending = latestTx.status === TransactionStatuses.PENDING

      if (isPending && !isExpired) {
        session.flash('general_errors', 'Masih ada pembayaran yang sedang aktif')
        return response.redirect().toRoute('transactions.full.show', { id: order.number })
      }

      // Mark stale pending transactions as cancelled to avoid revisiting expired pages
      if (isPending && isExpired) {
        await latestTx
          .merge({
            status: TransactionStatuses.CANCELLED,
            midtransStatus: MidtransStatuses.CANCEL,
          })
          .save()
      }
    }

    const key = `payment_FULL_${request.ip()}_${order.number}`
    const downPaymentLimiter = limiter.use({
      requests: 1,
      duration: '15 min',
    })

    const orderId = `FULL_${order.number}_${DateTime.now().toFormat('yyyyMMddHHmmss')}`

    try {
      await downPaymentLimiter.consume(key)

      // Call Midtrans API to create QRIS payment
      const result: MidtransQrisResponse = await this.coreApi.charge({
        payment_type: 'qris',
        qris: { acquirer: 'gopay' },
        transaction_details: {
          order_id: orderId,
          gross_amount: payload.amount,
        },
        customer_details: {
          name: order.address.name,
          phone: order.address.phone,
          address: order.address.street,
        },
        item_details: {
          id: order.id,
          name: `Order ${order.number}`,
          price: payload.amount,
          quantity: 1,
        },
      })

      const url = result.actions.find((a) => a.name === 'generate-qr-code-v2')?.url
      const midtransQrCode = url?.split('/')[6] // index 5 is the ID

      // Store transaction in database
      await Transaction.create({
        orderId: order.id,
        type: 'full_payment',
        amount: payload.amount,
        status: TransactionStatuses.PENDING,
        midtransStatus: MidtransStatuses.PENDING,
        midtransId: result.transaction_id,
        expiredAt: DateTime.now().plus({ minutes: 15 }),
        midtransQrCode,
      })

      // Show QR code page
      return response.redirect().toRoute('transactions.full.show', { id: order.number })
    } catch (error) {
      if (error instanceof errors.E_TOO_MANY_REQUESTS) {
        logger.warn('Too many payment attempts detected.')
        session.flash(
          'limiter_errors',
          'Terlalu banyak percobaan pembayaran. Silakan coba lagi nanti.'
        )
      } else {
        logger.error(`Payment creation failed: ${error.message}`)
        session.flash('general_errors', 'Gagal membuat transaksi. Silakan coba lagi.')
      }

      return response.redirect().back()
    }
  }

  /**
   * Helper: check if a transaction is expired
   * Accepts Luxon DateTime
   */
  private isExpired(expiredAt: DateTime) {
    const now = DateTime.now()
    return now >= expiredAt
  }
}
