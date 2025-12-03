import OrderActions from '#enums/order_action_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * StaffStageMiddleware
 *
 * Prevents staff from navigating away while working on an order stage.
 * Ensures one staff works on one stage at a time.
 *
 * How it works:
 * 1. Staff claims a stage (creates ATTEMPT_* action) → locked to that stage
 * 2. Can only access that stage's pages until completion or cancellation
 * 3. Completing or canceling releases the lock
 *
 * Allowed URLs while locked: /staff/{stage}/{orderNumber}[/claim|/complete|/cancel]
 */
export default class StaffStageMiddleware {
  /** Check if staff is locked to a stage and enforce navigation restrictions */
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const user = ctx.auth.getUserOrFail()

    // Only apply to staff, not regular users
    if (!user || user.isUser) {
      return ctx.response.redirect().toPath('/')
    }

    // Find active attempts: claimed stages that haven't been completed or released
    const activeAttempt = await OrderAction.query()
      .where('admin_id', user.id)
      .andWhereIn('action', [
        OrderActions.ATTEMPT_PICKUP,
        OrderActions.ATTEMPT_CHECK,
        OrderActions.ATTEMPT_DELIVERY,
      ])
      .whereDoesntHave('order', (orderQuery) => {
        // Exclude completed stages
        orderQuery.whereHas('actions', (actionQuery) => {
          actionQuery
            .where('admin_id', user.id)
            .andWhereIn('action', [OrderActions.PICKUP, OrderActions.CHECK, OrderActions.DELIVERY])
        })
      })
      .whereDoesntHave('order', (orderQuery) => {
        // Exclude released stages
        orderQuery.whereHas('actions', (actionQuery) => {
          actionQuery
            .where('admin_id', user.id)
            .andWhereIn('action', [
              OrderActions.RELEASE_PICKUP,
              OrderActions.RELEASE_CHECK,
              OrderActions.RELEASE_DELIVERY,
            ])
        })
      })
      .first()

    // If active attempt exists, staff is locked to that stage
    if (activeAttempt) {
      const order = await Order.find(activeAttempt.orderId)
      if (order) {
        // Map attempt action to stage name
        const stageMap: Record<string, string> = {
          [OrderActions.ATTEMPT_PICKUP]: 'pickup',
          [OrderActions.ATTEMPT_CHECK]: 'inspection',
          [OrderActions.ATTEMPT_DELIVERY]: 'delivery',
        }

        const lockedStage = stageMap[activeAttempt.action]

        // Check if trying to navigate away from locked stage
        const requestedUrl = ctx.request.url()
        const lockBase = `/staff/${lockedStage}/${order.number}`

        // Only allow stage-specific URLs: base, claim, complete, cancel
        const allowedUrls = [
          lockBase,
          `${lockBase}/claim`,
          `${lockBase}/complete`,
          `${lockBase}/cancel`,
        ]

        if (!allowedUrls.some((url) => requestedUrl.startsWith(url))) {
          // Redirect back with error: must complete or cancel current stage first
          ctx.session.flash(
            'general_errors',
            `Anda sedang mengerjakan tahap ${lockedStage} untuk pesanan ${order.number}. Selesaikan atau lepas tahap ini terlebih dahulu.`
          )
          return ctx.response.redirect().toPath(lockBase)
        }
      }
    }

    // No lock or accessing allowed URL - continue
    return next()
  }
}
