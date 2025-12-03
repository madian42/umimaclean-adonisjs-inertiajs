import { z } from 'zod'
import { shoe } from './schema'

const fileSizeLimit = 5 * 1024 * 1024

export const uploadPhotoSchema = z.object({
  image: z
    .instanceof(File)
    .refine((file) => ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type), {
      message: 'Tipe file tidak valid',
    })
    .refine((file) => file.size <= fileSizeLimit, {
      message: 'Ukuran file tidak boleh melebihi 5MB',
    }),
})

export const inspectionSchema = z.object({
  shoes: z.array(shoe),
})

export type UploadPhotoSchema = z.infer<typeof uploadPhotoSchema>
export type InspectionSchema = z.infer<typeof inspectionSchema>
