import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Automatically shares authentication state and flash messages
 * with frontend to avoid manual prop passing
 */
export default class InertiaRequestMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.inertia.share({
      auth: () => ({
        user: ctx.auth?.user,
      }),
      errors: () => ({
        validation_errors: ctx.session?.flashMessages.get('validation_errors'),
        general_errors: ctx.session?.flashMessages.get('general_errors'),
        limiter_errors: ctx.session?.flashMessages.get('limiter_errors'),
        google_errors: ctx.session?.flashMessages.get('google_errors'),
      }),
    })

    return await next()
  }
}
