import { updateNameValidator, updatePasswordValidator } from '#validators/profile_validator'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async index({ inertia, request }: HttpContext) {
    const accordionState = request.qs().accordionState

    return inertia.render('user/profile/index', { accordionState })
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

  async updateName({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateNameValidator)

    await user.merge({ name: payload.name }).save()

    return response.redirect().back()
  }
}
