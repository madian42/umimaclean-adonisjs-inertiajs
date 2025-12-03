import PasswordResetNotification from '#mails/password_reset_mail'
import PasswordResetToken from '#models/password_reset_token'
import User from '#models/user'
import { forgotPasswordValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'

export default class ForgotPasswordController {
  async show({ inertia }: HttpContext) {
    return inertia.render('auth/forgot-password')
  }

  async handle({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(forgotPasswordValidator)

    const trx = await db.transaction()
    try {
      const user = await User.findBy('email', payload.email)
      if (user) {
        const token = await PasswordResetToken.generateToken(user, trx)
        await mail.sendLater(new PasswordResetNotification(user, token.token))

        await trx.commit()
      }

      return response.redirect().back()
    } catch (error) {
      await trx.rollback()

      logger.error(`Error sending password reset email: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat mengirim email reset password')
      return response.redirect().back()
    }
  }
}
