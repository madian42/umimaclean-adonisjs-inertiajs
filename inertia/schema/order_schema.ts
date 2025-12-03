import z from 'zod'
import { name, phone, shoe } from './schema'

export const orderSchema = z.object({
  addressId: z
    .uuid({
      error: 'ID Alamat harus berupa UUID yang valid',
    })
    .nullable(),
  date: z.date({
    error: 'Tanggal harus berupa tanggal yang valid2',
  }),
})

export const createOrderSchema = z.object({
  name,
  phone,
  totalShoe: z.number().min(0, { error: 'Jumlah sepatu tidak boleh negatif' }),
  shoes: z.array(shoe, {
    error: 'Setidaknya harus ada satu sepatu dalam pesanan',
  }),
})

export type OrderPayload = z.infer<typeof orderSchema>
export type CreateOrderPayload = z.infer<typeof createOrderSchema>
