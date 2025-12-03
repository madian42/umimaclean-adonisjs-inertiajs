import OrderActions from '#enums/order_action_enum'
import Order from '#models/order'
import OrderAction from '#models/order_action'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * StaffStageMiddleware
 *
 * Prevents staff from navigating away while working on an order stage.
 * Implements stage locking mechanism to ensure single-staff-per-stage workflow.
 *
 * Business Logic:
 * - Staff can only work on one stage at a time
 * - If staff has an active ATTEMPT_* action without completion, they're locked to that stage
 * - Staff must either complete the stage or release it before navigating elsewhere
 * - Prevents confusion when multiple staff work simultaneously
 * - Ensures accountability (one staff member per stage)
 *
 * Stage Locking Flow:
 * 1. Staff creates ATTEMPT_PICKUP action (claims pickup stage)
 * 2. Staff is now locked to pickup stage for that order
 * 3. Staff can ONLY navigate to:
 *    - Pickup pages for that order
 *    - Release pickup action
 * 4. Once staff completes PICKUP or RELEASE_PICKUP, lock is released
 *
 * Allowed Actions While Locked:
 * - ATTEMPT_* → Claim stage (creates lock)
 * - PICKUP/CHECK/DELIVERY → Complete stage (releases lock)
 * - RELEASE_* → Release stage without completion (releases lock)
 *
 * URLs Allowed While Locked to a Stage:
 * - /staff/orders/ship/{stage}/{orderNumber} (main stage page)
 * - /staff/orders/ship/{stage}/{orderNumber}/complete (completion page)
 * - /staff/orders/ship/{stage}/{orderNumber}/release (release page)
 *
 * Usage:
 * Apply this middleware to staff routes that shouldn't be accessed
 * when staff is locked to a stage.
 *
 * Example in routes:
 * ```typescript
 * router.group(() => {
 *   router.get('/staff/dashboard', [TaskController, 'index'])
 *     .use(middleware.stageMiddleware())
 * })
 * ```
 */
export default class StaffStageMiddleware {
  /**
   * Handle HTTP request
   *
   * Checks if staff has an active stage lock and enforces navigation restrictions.
   *
   * @param ctx - HTTP context with auth, request, response, session
   * @param next - Next middleware in chain
   * @returns Redirect if locked to stage, otherwise continues to next middleware
   */
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const user = ctx.auth.getUserOrFail()

    // Only apply to staff members
    // Regular users are not subject to stage locking
    if (!user || user.isUser) {
      return ctx.response.redirect().toPath('/')
    }

    /**
     * Check if staff has any active attempts (claimed but not completed stages)
     *
     * An "active attempt" is when:
     * 1. Staff created ATTEMPT_* action
     * 2. No corresponding completion action (PICKUP/CHECK/DELIVERY) exists
     * 3. No release action (RELEASE_*) exists
     *
     * This query finds attempts that are still "open" (not completed or released)
     */
    const activeAttempt = await OrderAction.query()
      .where('admin_id', user.id)
      .andWhereIn('action', [
        OrderActions.ATTEMPT_PICKUP,
        OrderActions.ATTEMPT_CHECK,
        OrderActions.ATTEMPT_DELIVERY,
      ])
      .whereDoesntHave('order', (orderQuery) => {
        // Exclude if the stage has been completed (has corresponding completion action)
        orderQuery.whereHas('actions', (actionQuery) => {
          actionQuery
            .where('admin_id', user.id)
            .andWhereIn('action', [OrderActions.PICKUP, OrderActions.CHECK, OrderActions.DELIVERY])
        })
      })
      .whereDoesntHave('order', (orderQuery) => {
        // Exclude if the stage has been released
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

    /**
     * If active attempt found, staff is locked to that stage
     * Must navigate only to that stage's pages
     */
    if (activeAttempt) {
      const order = await Order.find(activeAttempt.orderId)
      if (order) {
        /**
         * Determine which stage is locked based on the attempt action
         *
         * Stage Mapping:
         * - ATTEMPT_PICKUP → 'pickup' stage (online orders only)
         * - ATTEMPT_CHECK → 'check' stage (all orders)
         * - ATTEMPT_DELIVERY → 'delivery' stage (all orders)
         */
        const stageMap: Record<string, string> = {
          [OrderActions.ATTEMPT_PICKUP]: 'pickup',
          [OrderActions.ATTEMPT_CHECK]: 'check',
          [OrderActions.ATTEMPT_DELIVERY]: 'delivery',
        }

        const lockedStage = stageMap[activeAttempt.action]

        /**
         * Prevent navigation away from locked stage
         *
         * Allowed URLs while locked:
         * 1. /staff/orders/ship/{stage}/{orderNumber} - Main stage page
         * 2. /staff/orders/ship/{stage}/{orderNumber}/complete - Complete stage
         * 3. /staff/orders/ship/{stage}/{orderNumber}/release - Release stage
         *
         * Any other URL triggers redirect back to locked stage
         */
        const requestedUrl = ctx.request.url()
        const lockBase = `/staff/orders/ship/${lockedStage}/${order.number}`

        // Allow only these URLs while locked:
        // - Base stage URL
        // - Complete endpoint
        // - Release endpoint
        const allowedUrls = [lockBase, `${lockBase}/complete`, `${lockBase}/release`]

        if (!allowedUrls.some((url) => requestedUrl.startsWith(url))) {
          /**
           * Staff is trying to navigate away while locked to a stage
           * Redirect back to the locked stage with error message
           *
           * Error message format:
           * "Anda sedang mengerjakan tahap {stage} untuk pesanan {orderNumber}.
           *  Selesaikan atau lepas tahap ini terlebih dahulu."
           *
           * Translation:
           * "You are working on {stage} stage for order {orderNumber}.
           *  Complete or release this stage first."
           */
          ctx.session.flash(
            'general_errors',
            `Anda sedang mengerjakan tahap ${lockedStage} untuk pesanan ${order.number}. Selesaikan atau lepas tahap ini terlebih dahulu.`
          )
          return ctx.response.redirect().toPath(lockBase)
        }
      }
    }

    // No active stage lock or navigating to allowed URL
    // Continue to requested route
    return next()
  }
}
