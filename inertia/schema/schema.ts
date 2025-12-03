import { z } from 'zod'

export const name = z
  .string({
    error: 'Nama harus diisi',
  })
  .trim()
  .max(100, { error: 'Nama maksimal 100 karakter' })
  .regex(/^[a-zA-Z\s.-]+$/, {
    error: 'Nama hanya boleh berisi huruf, spasi, dan tanda hubung',
  })

export const email = z.email({ error: 'Format email tidak valid' }).trim()

export const phone = z
  .string({
    error: 'Nomor telepon harus diisi',
  })
  .trim()
  .min(11, { error: 'Nomer telepon minimal 11 karakter' })
  .max(12, { error: 'Nomor telepon maksimal 12 karakter' })
  .regex(/^\d+$/, {
    error: 'Nomor telepon hanya boleh berisi angka',
  })

export const password = z
  .string({
    error: 'Kata sandi harus diisi',
  })
  .trim()
  .min(8, { error: 'Kata sandi minimal 8 karakter' })
  .max(16, { error: 'Kata sandi maksimal 16 karakter' })
  .regex(/^(?=.*\d)[A-Za-z\d]{8,16}$/, {
    error: 'Kata sandi harus terdiri dari kombinasi huruf dan angka',
  })
