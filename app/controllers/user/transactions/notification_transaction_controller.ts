import OrderStatuses from '#enums/order_status_enum'
import MidtransStatuses from '#enums/midtrans_status'
import TransactionStatuses from '#enums/transaction_status_enum'
import OrderStatus from '#models/order_status'
import Transaction from '#models/transaction'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'
import { DateTime } from 'luxon'
import { createHash } from 'node:crypto'

interface MidtransNotification {
  transaction_type: string
  transaction_time: string
  transaction_status: string
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  settlement_time: string
  payment_type: string
  order_id: string
  merchant_id: string
  issuer: string
  gross_amount: string
  fraud_status: string
  currency: string
  acquirer: string
  expiry_time?: string
  custom_field1: string
}

export default class NotificationTransactionController {
  /**
   * Handle webhook notification from Midtrans
   *
   * Business Logic:
   * - Midtrans sends notification when payment status changes
   * - Validates signature to ensure request is authentic
   * - Updates transaction status based on Midtrans response
   * - Creates order status records to track workflow
   * - Broadcasts update to frontend for real-time UI refresh
   *
   * Payment Flow:
   * 1. DP settlement → Status: PICKUP_SCHEDULED
   * 2. Full payment settlement → Status: IN_PROCESS
   */
  async handle({ request, response, session }: HttpContext) {
    const notification = request.body() as MidtransNotification

    // Security: Verify signature to prevent fraud
    const isValidSignature = await this.verifySignature(notification)
    if (!isValidSignature) {
      logger.warn('Invalid Midtrans signature for order ' + notification.order_id)
      session.flash('general_errors', 'Signature tidak valid')
      return response.redirect().back()
    }

    const trx = await db.transaction()

    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { transaction_status, transaction_id, settlement_time } = notification

      // Find transaction by Midtrans transaction ID
      const transaction = await Transaction.query({ client: trx })
        .where('midtrans_id', transaction_id)
        .preload('order')
        .first()

      if (!transaction) {
        await trx.rollback()
        throw new Error('Transaction not found for midtrans id ' + transaction_id)
      }

      // Handle Down Payment settlement
      if (
        transaction.type === 'down_payment' &&
        transaction_status === MidtransStatuses.SETTLEMENT
      ) {
        await transaction
          .merge({
            midtransStatus: MidtransStatuses.SETTLEMENT,
            paymentAt: DateTime.fromSQL(settlement_time),
            status: TransactionStatuses.PAID,
          })
          .useTransaction(trx)
          .save()

        // Update order: DP paid → ready for pickup scheduling
        const order = transaction.order
        const existingStatus = await OrderStatus.query({ client: trx })
          .where('order_id', order.id)
          .andWhere('name', OrderStatuses.PICKUP_SCHEDULED)
          .first()

        if (!existingStatus) {
          await OrderStatus.create(
            {
              orderId: order.id,
              name: OrderStatuses.PICKUP_SCHEDULED,
            },
            { client: trx }
          )
        }

        await trx.commit()

        // Real-time notification to customer's browser
        transmit.broadcast(`payments/${order.number}/dp`, {
          status: transaction_status,
        })
      }

      // Handle Full Payment settlement
      if (
        transaction.type === 'full_payment' &&
        transaction_status === MidtransStatuses.SETTLEMENT
      ) {
        await transaction
          .merge({
            midtransStatus: MidtransStatuses.SETTLEMENT,
            paymentAt: DateTime.fromSQL(settlement_time),
            status: TransactionStatuses.PAID,
          })
          .useTransaction(trx)
          .save()

        // Update order: Full payment → shoes can be processed
        const order = transaction.order
        const existingStatus = await OrderStatus.query({ client: trx })
          .where('order_id', order.id)
          .andWhere('name', OrderStatuses.IN_PROCESS)
          .first()

        if (!existingStatus) {
          await OrderStatus.create(
            {
              orderId: order.id,
              name: OrderStatuses.IN_PROCESS,
            },
            { client: trx }
          )
        }

        await trx.commit()

        // Real-time notification to customer's browser
        transmit.broadcast(`payments/${order.number}/full`, {
          status: transaction_status,
        })
      }

      return response.redirect().toRoute('orders.show', { id: transaction.order.number })
    } catch (error) {
      await trx.rollback()

      logger.error(`Failed processing Midtrans notification: ${error.message}`)
      // Extract order number from order_id format: PREFIX_ORDERNUMBER_TIMESTAMP
      const orderNumber = notification.order_id.split('_')[1]
      return response.redirect().toRoute('orders.show', { id: orderNumber })
    }
  }

  /**
   * Verify Midtrans webhook signature
   *
   * Security:
   * - Prevents fake payment notifications
   * - Uses SHA512 hash of: order_id + status_code + amount + server_key
   * - Signature must match Midtrans-provided signature
   */
  private async verifySignature(notification: MidtransNotification) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { order_id, status_code, gross_amount, signature_key } = notification

    const serverKey = env.get('MIDTRANS_SERVER_KEY')
    const hashString = order_id + status_code + gross_amount + serverKey
    const calculatedSignature = createHash('sha512').update(hashString).digest('hex')

    return calculatedSignature === signature_key
  }
}
