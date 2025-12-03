import Address from '#models/address'
import { addressValidator } from '#validators/address_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'

export default class AddressController {
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const address = await Address.findBy('user_id', user.id)

    return inertia.render('user/profile/address', {
      address,
    })
  }

  async store({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(addressValidator)

    const isWithinArea = await Address.validateRadius(payload.latitude, payload.longitude)
    if (!isWithinArea) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'radius',
          message: 'Alamat Anda tidak berada dalam area layanan. Silakan pilih lokasi lain.',
        },
      ])
    }

    await Address.updateOrCreate(
      { userId: user.id },
      {
        ...payload,
      }
    )

    return response.redirect().back()
  }
}
