import PasswordResetToken from '#models/password_reset_token'
import User from '#models/user'
import { resetPasswordValidator } from '#validators/auth_validator'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

export default class ResetPasswordController {
  async show({ inertia, params }: HttpContext) {
    const token = await PasswordResetToken.getToken(params.token)
    if (!token) {
      return inertia.render('errors/invalid-token')
    }

    return inertia.render('auth/reset-password')
  }

  async handle({ request, params, session, inertia, response }: HttpContext) {
    const token = await PasswordResetToken.getToken(params.token)
    if (!token) {
      return inertia.render('errors/invalid-token')
    }

    const payload = await request.validateUsing(resetPasswordValidator)
    const user = await User.findOrFail(token.userId)

    const trx = await db.transaction()
    try {
      await user.useTransaction(trx).merge({ password: payload.password }).save()
      await PasswordResetToken.deleteTokens(user, trx)

      await trx.commit()

      return response.redirect().toRoute('login.show')
    } catch (error) {
      await trx.rollback()

      logger.error(`Error resetting password: ${error.message}`)
      session.flash('general_errors', 'Terjadi kesalahan saat mereset password.')
      return response.redirect().toPath(`/reset-password?token=${token}`)
    }
  }
}
