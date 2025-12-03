import OrderActions from '#enums/order_action_enum'
import OrderPhotoStages from '#enums/order_photo_stage_enum'
import OrderStatuses from '#enums/order_status_enum'
import TransactionStatuses from '#enums/transaction_status_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import OrderPhoto from '#models/order_photo'
import OrderStatus from '#models/order_status'
import Service from '#models/service'
import Transaction from '#models/transaction'
import TransactionItem from '#models/transaction_item'
import { inspectionValidatorWithPhoto } from '#validators/photo_validator'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

export default class InspectionController {
  async index({ inertia, params, session, response }: HttpContext) {
    // Load order with all related data
    const order = await Order.query()
      .where('number', params.id)
      .preload('address')
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc')
      })
      .preload('photos')
      .preload('shoes')
      .first()

    if (!order) {
      session.flash('general_errors', 'Order tidak ditemukan.')
      return response.redirect().toRoute('staff.tasks')
    }

    const services = await Service.query()
      .where('type', 'primary')
      .andWhere('type', 'start_from')
      .orderBy('price', 'asc')

    const additional = await Service.query().where('type', 'additional').orderBy('price', 'asc')

    return inertia.render('staff/order/inspection', {
      order,
      services,
      additional,
    })
  }

  /**
   * Allow staff to claim a pickup stage for a order
   *
   * Business Logic:
   * - Staff claims a stage to prevent concurrent work by multiple staff
   * - Creates ATTEMPT_* action for audit trail
   * - Updates order status to show stage is in progress
   * - If stage already completed (photo exists), redirect with error
   * - If another staff claimed the stage, redirect with error
   * - Creates status record to track workflow progression
   */
  async handle({ params, auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    // Load order with all related data
    const order = await Order.query()
      .where('number', params.id)
      .preload('address')
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc')
      })
      .preload('photos')
      .preload('shoes')
      .first()

    if (!order) {
      session.flash('general_errors', 'Order tidak ditemukan.')
      return response.redirect().toRoute('staff.tasks')
    }

    // Check if stage is already completed (photo uploaded)
    const existingPhoto = await OrderPhoto.query()
      .where('order_id', order.id)
      .andWhere('stage', OrderPhotoStages.CHECK)
      .first()

    if (existingPhoto) {
      session.flash(
        'general_errors',
        'Tahap ini sudah selesai. Lepas tahap lain atau lanjut ke pesanan berikutnya.'
      )
      return response.redirect().toRoute('staff.tasks')
    }

    // Check if another staff has claimed this stage
    const existingAction = await OrderAction.query()
      .where('order_id', order.id)
      .andWhere('action', OrderActions.ATTEMPT_CHECK)
      .orderBy('created_at', 'desc')
      .first()

    // Stage is locked by another staff member
    if (existingAction && existingAction.adminId !== user.id) {
      session.flash('general_errors', 'Tahap ini sudah diambil oleh staff lain.')
      return response.redirect().toRoute('staff.tasks')
    }

    const trx = await db.transaction()

    try {
      // Create attempt action (only if not already exists)
      if (!existingAction) {
        await OrderAction.create(
          {
            orderId: order.id,
            adminId: user.id,
            action: OrderActions.ATTEMPT_CHECK,
            note: null,
          },
          { client: trx }
        )
      }

      const existingStatus = await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.IN_PROCESS)
        .first()

      // Create status only if doesn't exist (avoid duplicates)
      if (!existingStatus) {
        await OrderStatus.create(
          { orderId: order.id, name: OrderStatuses.IN_PROCESS },
          { client: trx }
        )
      }

      await trx.commit()

      return response.redirect().toRoute('staff.inspection', { id: order.number })
    } catch (error) {
      await trx.rollback()

      logger.error(`Error during ship mode operation: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat memproses permintaan Anda.')
      return response.redirect().toRoute('staff.tasks')
    }
  }

  /**
   * Release a claimed stage without completing it
   *
   * Business Logic:
   * - Staff can release a stage they've claimed but not completed
   * - Verifies staff has claimed the stage (ATTEMPT_* action exists)
   * - Creates RELEASE_* action with optional note for audit
   * - Removes in-progress status to free up the stage
   * - Another staff can then claim the stage
   * - Useful when staff needs to switch tasks or encounters issues
   */
  async cancel({ session, response, params, request, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = request.only(['note'])

    const order = await Order.findBy('number', params.id)
    if (!order) {
      session.flash('general_errors', 'Order tidak ditemukan.')
      return response.redirect().back()
    }

    const attemptAction = await OrderAction.query()
      .where('order_id', order.id)
      .andWhere('action', OrderActions.ATTEMPT_CHECK)
      .andWhere('admin_id', user.id)
      .orderBy('created_at', 'desc')
      .first()

    if (!attemptAction) {
      session.flash('general_errors', 'Tahap belum diambil.')
      return response.redirect().back()
    }

    const trx = await db.transaction()

    try {
      // Create release action with optional note (for audit)
      await OrderAction.create(
        {
          orderId: order.id,
          adminId: user.id,
          action: OrderActions.RELEASE_CHECK,
          note: payload.note || null, // Optional reason for release
        },
        { client: trx }
      )

      await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.INSPECTION)
        .delete()

      await trx.commit()

      // Show confirmation page
      return response.redirect().toRoute('staff.tasks')
    } catch (error) {
      await trx.rollback()

      logger.error(`Error during release: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat melepas tahap.')
      return response.redirect().back()
    }
  }

  async complete({ params, auth, response, request, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(inspectionValidatorWithPhoto)

    const order = await Order.query().where('number', params.id).first()
    if (!order) {
      session.flash('general_errors', 'Order tidak ditemukan.')
      return response.redirect().back()
    }

    // Verify staff has claimed inspection stage
    const attemptAction = await OrderAction.query()
      .where('order_id', order.id)
      .andWhere('action', OrderActions.ATTEMPT_CHECK)
      .andWhere('admin_id', user.id)
      .orderBy('created_at', 'desc')
      .first()

    if (!attemptAction) {
      session.flash('general_errors', 'Tahap pengecekan belum diambil.')
      return response.redirect().back()
    }

    // Save inspection photo
    const fileName = `${order.number}.${payload.image.extname}`
    const relativePath = `inspections/${fileName}`

    await payload.image.moveToDisk(relativePath)

    const trx = await db.transaction()

    try {
      // Create photo record
      const orderPhoto = await OrderPhoto.create(
        {
          orderId: order.id,
          adminId: user.id,
          stage: OrderPhotoStages.CHECK,
          path: relativePath,
          note: null,
        },
        { client: trx }
      )

      // Calculate total amount for transaction
      let totalAmount = 0

      // We will create transaction first, then attach items
      const transaction = await Transaction.create(
        {
          orderId: order.id,
          amount: 0, // temporarily 0, will update after items are created
          status: TransactionStatuses.PARTIALLY_PAID,
          type: 'full_payment',
        },
        { client: trx }
      )

      // Save shoe inspection details
      for (const shoe of payload.shoes) {
        const createdShoe = await order.related('shoes').create(
          {
            brand: shoe.brand,
            type: shoe.type,
            size: shoe.size,
            material: shoe.material,
            category: shoe.category,
            condition: shoe.condition,
          },
          { client: trx }
        )

        // Base services
        for (const serviceId of shoe.services) {
          const service = await Service.findOrFail(serviceId)
          const quantity = 1
          const itemPrice = service.price
          const itemSubtotal = itemPrice * quantity

          await TransactionItem.create(
            {
              transactionId: transaction.id,
              shoeId: createdShoe.id,
              serviceId: service.id,
              itemPrice: itemPrice, // snapshot from Service.price
              subtotal: itemSubtotal,
            },
            { client: trx }
          )

          totalAmount += itemSubtotal
        }

        // Additional services (if any)
        if (shoe.additionalServices && shoe.additionalServices.length > 0) {
          for (const additionalServiceId of shoe.additionalServices) {
            const service = await Service.findOrFail(additionalServiceId)
            const quantity = 1
            const itemPrice = service.price
            const itemSubtotal = itemPrice * quantity

            await TransactionItem.create(
              {
                transactionId: transaction.id,
                shoeId: createdShoe.id,
                serviceId: service.id,
                itemPrice: itemPrice,
                subtotal: itemSubtotal,
              },
              { client: trx }
            )

            totalAmount += itemSubtotal
          }
        }
      }

      // Update transaction amount with the computed total
      await transaction.useTransaction(trx).merge({ amount: totalAmount }).save()

      // Create CHECK completion action
      await OrderAction.create(
        {
          orderId: order.id,
          orderPhotoId: orderPhoto.id,
          adminId: user.id,
          action: OrderActions.CHECK,
          note: null,
        },
        { client: trx }
      )

      // Update order status to waiting payment
      const existingStatus = await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.WAITING_PAYMENT)
        .first()

      if (!existingStatus) {
        await OrderStatus.create(
          { orderId: order.id, name: OrderStatuses.WAITING_PAYMENT },
          { client: trx }
        )
      }

      await trx.commit()

      session.flash('success', 'Pengecekan sepatu berhasil diselesaikan!')
      return response.redirect().toRoute('staff.tasks')
    } catch (error) {
      await trx.rollback()

      logger.error(`Error during inspection completion: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat menyelesaikan pengecekan.')
      return response.redirect().back()
    }
  }
}
