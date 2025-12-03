import { z } from 'zod'
import { name, phone } from './schema'

export const addressSchema = z.object({
  name,
  phone,
  street: z
    .string({
      error: 'Nama jalan harus diisi',
    })
    .max(255),
  latitude: z
    .number({
      error: 'Lintang harus diisi',
    })
    .min(-90, {
      error: 'Lintang minimal -90',
    })
    .max(90, {
      error: 'Lintang maksimal 90',
    }),
  longitude: z
    .number({
      error: 'Bujur harus diisi',
    })
    .min(-180, {
      error: 'Bujur minimal -180',
    })
    .max(180, {
      error: 'Bujur maksimal 180',
    }),
  radius: z
    .number({ error: 'Radius harus diisi' })
    .positive({ error: 'Radius harus angka positif' })
    .max(40000, { error: 'Radius maksimal 40000' }),
  note: z.string().max(255).optional(),
})

export type AddressPayload = z.infer<typeof addressSchema>
