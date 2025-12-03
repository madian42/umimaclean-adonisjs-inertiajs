import OrderActions from '#enums/order_action_enum'
import OrderPhotoStages from '#enums/order_photo_stage_enum'
import OrderStatuses from '#enums/order_status_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import OrderPhoto from '#models/order_photo'
import OrderStatus from '#models/order_status'
import { uploadPhotoValidator } from '#validators/photo_validator'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

export default class DeliveryController {
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

    return inertia.render('staff/order/delivery', {
      order,
    })
  }

  /**
   * Allow staff to claim a delivery stage for an order
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
      .andWhere('stage', OrderPhotoStages.DELIVERY)
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
      .andWhere('action', OrderActions.ATTEMPT_DELIVERY)
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
            action: OrderActions.ATTEMPT_DELIVERY,
            note: null,
          },
          { client: trx }
        )
      }

      const existingStatus = await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.DELIVERY)
        .first()

      // Create status only if doesn't exist (avoid duplicates)
      if (!existingStatus) {
        await OrderStatus.create(
          { orderId: order.id, name: OrderStatuses.DELIVERY },
          { client: trx }
        )
      }

      await trx.commit()

      return response.redirect().toRoute('staff.delivery', { id: order.number })
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
      .andWhere('action', OrderActions.ATTEMPT_DELIVERY)
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
          action: OrderActions.RELEASE_DELIVERY,
          note: payload.note || null, // Optional reason for release
        },
        { client: trx }
      )

      await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.IN_PROCESS)
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

  /**
   * Handle photo upload for a claimed stage
   *
   * Business Logic:
   * - Verifies staff has claimed the stage (ATTEMPT_* action exists)
   * - Saves photo to stage-specific directory
   * - Creates photo record linking to order and staff
   * - Creates completion action (PICKUP/CHECK/DELIVERY) with photo reference
   * - Updates order status to next stage
   * - Uses transaction to ensure data consistency
   */
  async complete({ response, request, session, params, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(uploadPhotoValidator)

    const order = await Order.query().where('number', params.id).first()
    if (!order) {
      session.flash('general_errors', 'Order tidak ditemukan.')
      return response.redirect().back()
    }

    const attemptAction = await OrderAction.query()
      .where('order_id', order.id)
      .andWhere('action', OrderActions.ATTEMPT_DELIVERY)
      .andWhere('admin_id', user.id)
      .orderBy('created_at', 'desc')
      .first()

    if (!attemptAction) {
      session.flash('general_errors', 'Tahap belum diambil.')
      return response.redirect().back()
    }

    const fileName = `${order.number}.${payload.image.extname}`
    const relativePath = `deliveries/${fileName}`

    // Save file to disk
    await payload.image.moveToDisk(relativePath)

    const trx = await db.transaction()

    try {
      // Create photo record
      const orderPhoto = await OrderPhoto.create(
        {
          orderId: order.id,
          adminId: user.id,
          stage: OrderPhotoStages.DELIVERY,
          path: relativePath,
          note: null,
        },
        { client: trx }
      )

      // Create completion action with photo reference (for audit)
      await OrderAction.create(
        {
          orderId: order.id,
          orderPhotoId: orderPhoto.id, // Links action to photo
          adminId: user.id,
          action: OrderActions.DELIVERY,
          note: null,
        },
        { client: trx }
      )

      // Update order status to next stage
      const existingStatus = await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.COMPLETED)
        .first()

      if (!existingStatus) {
        await OrderStatus.create(
          { orderId: order.id, name: OrderStatuses.COMPLETED },
          { client: trx }
        )
      }

      await trx.commit()

      // Show success page with uploaded photo
      return response.redirect().toRoute('staff.tasks')
    } catch (error) {
      await trx.rollback()

      logger.error(`Error during photo upload: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat mengunggah foto.')
      return response.redirect().back()
    }
  }
}
