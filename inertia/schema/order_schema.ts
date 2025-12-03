import z from 'zod'

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

export type OrderPayload = z.infer<typeof orderSchema>
