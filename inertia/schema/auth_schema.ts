import { z } from 'zod'
import { email, name, password } from './schema'

export const loginSchema = z.object({
  email,
  password,
  remember_me: z.boolean().optional(),
})

export const registerSchema = z
  .object({
    name,
    email,
    password,
    password_confirmation: password,
  })
  .refine((data) => data.password === data.password_confirmation, {
    error: 'Kata sandi dan konfirmasi kata sandi harus sama',
    path: ['password_confirmation'],
  })

export const forgotPasswordSchema = z.object({
  email,
})

export const resetPasswordSchema = z
  .object({
    password,
    password_confirmation: password,
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Kata sandi dan konfirmasi kata sandi harus sama',
    path: ['password_confirmation'],
  })

export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
