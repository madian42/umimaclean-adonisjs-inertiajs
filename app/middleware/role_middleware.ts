import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Role middleware is used to check if the authenticated user has the required role.
 *
 * Usage:
 * - Single role: .use(middleware.role('staff'))
 * - Multiple roles: .use(middleware.role(['staff', 'admin']))
 *
 * The middleware will:
 * - Redirect users without required role to appropriate page
 * - Allow users with matching role to proceed
 *
 * User role properties:
 * - user.isUser - Regular customer (roleId = 3)
 * - user.isStaff - Staff member (roleId = 2)
 * - user.isAdmin - Administrator (roleId = 1)
 */
export default class RoleMiddleware {
  /**
   * Handle incoming request and check user role
   *
   * @param ctx - HTTP context
   * @param next - Next function to call
   * @param options - Configuration options
   * @param options.role - Single role or array of allowed roles
   */
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      role?: 'staff' | 'admin' | 'user' | ('staff' | 'admin' | 'user')[]
    } = {}
  ) {
    const { auth, response, session } = ctx

    // Ensure user is authenticated
    const user = auth.getUserOrFail()

    // Default to 'user' if no role specified
    const allowedRoles = Array.isArray(options.role)
      ? options.role
      : options.role
        ? [options.role]
        : ['user']

    // Check if user has any of the allowed roles
    const hasRequiredRole = allowedRoles.some((role) => {
      switch (role) {
        case 'admin':
          return user.isAdmin
        case 'staff':
          return user.isStaff
        case 'user':
          return user.isUser
        default:
          return false
      }
    })

    // If user doesn't have required role, redirect to appropriate page
    if (!hasRequiredRole) {
      session.flash('general_errors', 'Anda tidak memiliki akses ke halaman ini')

      // Redirect based on user's actual role
      if (user.isAdmin) {
        return response.redirect().toRoute('admin.dashboard')
      } else if (user.isStaff) {
        return response.redirect().toRoute('staff.task.index')
      } else if (user.isUser) {
        return response.redirect().toRoute('orders.create')
      }

      // Fallback to home if role is unknown
      return response.redirect().toRoute('home')
    }

    // User has required role, proceed to next middleware/controller
    return next()
  }
}
