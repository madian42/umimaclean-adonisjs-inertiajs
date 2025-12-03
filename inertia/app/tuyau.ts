import { createTuyau } from '@tuyau/client'
import { api } from 'umimaclean-adonisjs-inertiajs/api'

export const tuyau = createTuyau({
  api,
  baseUrl: 'https://still-bat-singularly.ngrok-free.app',
})
