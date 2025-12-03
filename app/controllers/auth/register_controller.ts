import User from '#models/user'
import { registerValidator } from '#validators/auth_validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import limiter from '@adonisjs/limiter/services/main'

export default class RegisterController {
  async show({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  async handle({ request, auth, response, session }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const key = `register_${request.ip()}_${payload.email}`
    const registerLimiter = limiter.use({
      requests: 10,
      duration: '1 min',
      blockDuration: '10 min',
    })

    const [errors, user] = await registerLimiter.penalize(key, async () => {
      return User.create(payload)
    })
    if (errors) {
      logger.error(`Registration failed for email: ${payload.email} from IP: ${request.ip()}`)
      session.flash(
        'limiter_errors',
        'Terlalu banyak percobaan registrasi. Silakan coba lagi nanti.'
      )
      return response.redirect().toRoute('register.show')
    }

    await auth.use('web').login(user)

    return response.redirect().toRoute('orders.create')
  }
}
