import type { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'
import logger from '@adonisjs/core/services/logger'
import { loginValidator } from '#validators/auth_validator'
import User from '#models/user'
import { getUserDashboardRoute } from '#utils/redirect_login'

export default class LoginController {
  async show({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async handle({ request, auth, session, response }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)

    const key = `login_${request.ip()}_${payload.email}`
    const loginLimiter = limiter.use({
      requests: 5,
      duration: '1 min',
      blockDuration: '5 min',
    })

    const [errors, user] = await loginLimiter.penalize(key, () => {
      return User.verifyCredentials(payload.email, payload.password)
    })
    if (errors) {
      logger.error(`Login failed for email: ${payload.email} from IP: ${request.ip()}`)
      session.flash('limiter_errors', 'Terlalu banyak percobaan login. Silakan coba lagi nanti.')
      return response.redirect().toRoute('login.show')
    }

    await auth.use('web').login(user, !!payload.remember_me)

    const dashboardRoute = getUserDashboardRoute(user.roleId)
    return response.redirect().toRoute(dashboardRoute)
  }
}
