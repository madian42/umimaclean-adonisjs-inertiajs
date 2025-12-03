import { z } from 'zod'
import { name, password } from './schema'

export const updateNameSchema = z.object({
  name,
})

export const updatePasswordSchema = z.object({
  current_password: password,
  password,
  password_confirmation: password,
})

export type UpdateNamePayload = z.infer<typeof updateNameSchema>
export type UpdatePasswordPayload = z.infer<typeof updatePasswordSchema>
