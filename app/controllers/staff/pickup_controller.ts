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

/**
 * Handles pickup stage for ONLINE orders only (offline orders skip this).
 * Staff claims task, uploads photo proof, then order moves to INSPECTION.
 * Can be released if unable to complete.
 */
export default class PickupController {
  /**
   * Show pickup page with order details and address.
   * Only for ONLINE orders.
   */
  async index({ inertia, params, session, response }: HttpContext) {
    // Load order with all related data
    const order = await Order.query()
      .where('number', params.id)
      .preload('address') // Pickup address (should exist for online orders)
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc') // Latest status first
      })
      .preload('photos') // Any photos already uploaded
      .preload('shoes') // Shoes to be picked up
      .first()

    if (!order) {
      session.flash('general_errors', 'Pesanan tidak ditemukan.')
      return response.redirect().toRoute('staff.tasks')
    }

    return inertia.render('staff/task/pickup', {
      order,
    })
  }

  /**
   * Claim pickup task (prevents concurrent work by other staff).
   * Creates ATTEMPT_PICKUP action and updates status to PICKUP_PROGRESS.
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
      session.flash('general_errors', 'Pesanan tidak ditemukan.')
      return response.redirect().toRoute('staff.tasks')
    }

    // Check if stage is already completed (photo uploaded)
    const existingPhoto = await OrderPhoto.query()
      .where('order_id', order.id)
      .andWhere('stage', OrderPhotoStages.PICKUP)
      .first()

    if (existingPhoto) {
      session.flash(
        'general_errors',
        'Tahap pickup sudah selesai. Pilih pesanan lain atau tahap berikutnya.'
      )
      return response.redirect().toRoute('staff.tasks')
    }

    // Check if another staff has claimed this stage
    const existingAction = await OrderAction.query()
      .where('order_id', order.id)
      .andWhere('action', OrderActions.ATTEMPT_PICKUP)
      .orderBy('created_at', 'desc')
      .first()

    // Stage is locked by another staff member
    if (existingAction && existingAction.adminId !== user.id) {
      session.flash('general_errors', 'Tahap pickup sudah diambil oleh staff lain.')
      return response.redirect().toRoute('staff.tasks')
    }

    const trx = await db.transaction()

    try {
      // Create attempt action (only if not already exists)
      // This locks the stage to this staff member
      if (!existingAction) {
        await OrderAction.create(
          {
            orderId: order.id,
            adminId: user.id,
            action: OrderActions.ATTEMPT_PICKUP,
            note: null,
          },
          { client: trx }
        )
      }

      // Check if status already exists (avoid duplicates)
      const existingStatus = await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.PICKUP_PROGRESS)
        .first()

      // Create status only if doesn't exist
      // Shows order is in pickup progress
      if (!existingStatus) {
        await OrderStatus.create(
          { orderId: order.id, name: OrderStatuses.PICKUP_PROGRESS },
          { client: trx }
        )
      }

      await trx.commit()

      // Redirect to pickup page (staff is now locked to this task)
      return response.redirect().toRoute('staff.pickup', { id: order.number })
    } catch (error) {
      await trx.rollback()

      logger.error(`Error claiming pickup task: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat mengambil tahap pickup.')
      return response.redirect().toRoute('staff.tasks')
    }
  }

  /**
   * Release claimed task without completing.
   * Creates RELEASE_PICKUP action and frees up the stage for another staff.
   */
  async cancel({ session, response, params, request, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = request.only(['note'])

    const order = await Order.findBy('number', params.id)
    if (!order) {
      session.flash('general_errors', 'Pesanan tidak ditemukan.')
      return response.redirect().back()
    }

    // Verify staff has claimed this pickup task
    const attemptAction = await OrderAction.query()
      .where('order_id', order.id)
      .andWhere('action', OrderActions.ATTEMPT_PICKUP)
      .andWhere('admin_id', user.id)
      .orderBy('created_at', 'desc')
      .first()

    if (!attemptAction) {
      session.flash('general_errors', 'Anda belum mengambil tahap pickup ini.')
      return response.redirect().back()
    }

    const trx = await db.transaction()

    try {
      // Create release action with optional note (for audit trail)
      // Note examples: "Customer tidak ada di rumah", "Alamat salah", etc.
      await OrderAction.create(
        {
          orderId: order.id,
          adminId: user.id,
          action: OrderActions.RELEASE_PICKUP,
          note: payload.note || null,
        },
        { client: trx }
      )

      // Remove in-progress status
      // Order returns to PICKUP_SCHEDULED status (previous status)
      await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.PICKUP_PROGRESS)
        .delete()

      await trx.commit()

      // Staff is now free to work on other tasks
      // Another staff can claim this pickup task
      return response.redirect().toRoute('staff.tasks')
    } catch (error) {
      await trx.rollback()

      logger.error(`Error releasing pickup task: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat melepas tahap pickup.')
      return response.redirect().back()
    }
  }

  /**
   * Complete pickup by uploading photo proof.
   * Creates photo record, PICKUP action, and updates status to INSPECTION.
   */
  async complete({ response, request, session, params, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(uploadPhotoValidator)

    const order = await Order.query().where('number', params.id).first()
    if (!order) {
      session.flash('general_errors', 'Pesanan tidak ditemukan.')
      return response.redirect().back()
    }

    // Verify staff has claimed this pickup task
    const attemptAction = await OrderAction.query()
      .where('order_id', order.id)
      .andWhere('action', OrderActions.ATTEMPT_PICKUP)
      .andWhere('admin_id', user.id)
      .orderBy('created_at', 'desc')
      .first()

    if (!attemptAction) {
      session.flash('general_errors', 'Anda belum mengambil tahap pickup ini.')
      return response.redirect().back()
    }

    // Generate unique filename using order number
    const fileName = `${order.number}.${payload.image.extname}`
    const relativePath = `pickups/${fileName}`

    // Save photo file to disk (configured storage location)
    await payload.image.moveToDisk(relativePath)

    const trx = await db.transaction()

    try {
      // Create photo record
      // Links photo to order, staff, and pickup stage
      const orderPhoto = await OrderPhoto.create(
        {
          orderId: order.id,
          adminId: user.id,
          stage: OrderPhotoStages.PICKUP,
          path: relativePath,
          note: null, // Optional note can be added later
        },
        { client: trx }
      )

      // Create completion action with photo reference (for audit trail)
      // This completes the pickup stage and links to photo
      await OrderAction.create(
        {
          orderId: order.id,
          orderPhotoId: orderPhoto.id, // Links action to uploaded photo
          adminId: user.id,
          action: OrderActions.PICKUP,
          note: null,
        },
        { client: trx }
      )

      // Update order status to next stage (INSPECTION)
      // Check if status already exists (avoid duplicates)
      const existingStatus = await OrderStatus.query({ client: trx })
        .where('order_id', order.id)
        .andWhere('name', OrderStatuses.INSPECTION)
        .first()

      if (!existingStatus) {
        await OrderStatus.create(
          { orderId: order.id, name: OrderStatuses.INSPECTION },
          { client: trx }
        )
      }

      await trx.commit()

      // Success! Staff is now free to work on other tasks
      // Order is now in inspection queue
      return response.redirect().toRoute('staff.tasks')
    } catch (error) {
      await trx.rollback()

      logger.error(`Error completing pickup: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat menyelesaikan pickup.')
      return response.redirect().back()
    }
  }
}
