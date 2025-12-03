import { updatePasswordValidator } from '#validators/profile_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class StaffProfileController {
  async index({ inertia, request, auth, response }: HttpContext) {
    if (auth.user?.isUser) {
      return response.redirect().toRoute('orders.create')
    }

    const accordionState = request.qs().accordionState

    return inertia.render('staff/profile/index', { accordionState })
  }

  async updatePassword({ request, response, session, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updatePasswordValidator)

    const isValid = await user.verifyPassword(payload.current_password)
    if (!isValid) {
      const validationErrors: Record<string, string> = {}
      validationErrors.current_password = 'Kata sandi saat ini salah'
      session.flash('validation_errors', validationErrors)
      return response.redirect().withQs({ accordionState: 'change-password' }).back()
    }

    await user.merge({ password: payload.password }).save()

    return response.redirect().back()
  }
}
