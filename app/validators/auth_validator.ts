import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { unique } from './unique.js'

/**
 * Centralized validation schemas with Indonesian error messages
 * to ensure consistent user experience across auth flows
 */

const messages = {
  'required': '{{ field }} harus diisi',
  'minLength': '{{ field }} harus memiliki minimal {{ min }} karakter',
  'maxLength': '{{ field }} harus memiliki maksimal {{ max }} karakter',
  'string': '{{ field }} harus berupa teks',
  'confirmed': '{{ field }} tidak cocok',
  'alpha': '{{ field }} hanya boleh berisi huruf, spasi, dan tanda hubung',
  'boolean': '{{ field }} harus berupa nilai benar atau salah',
  'phone.regex': '{{ field }} tidak valid',
  'password.regex': '{{ field }} harus memiliki 8-16 karakter dan berisi huruf serta angka',
  'sameAs': '{{ field }} harus sama dengan kata sandi',
  'email': '{{ field }} harus berupa alamat email yang valid',
}

const fields = {
  name: 'Nama',
  email: 'Alamat email',
  phone: 'Nomor telepon',
  password: 'Kata sandi',
  password_confirmation: 'Konfirmasi kata sandi',
}

vine.messagesProvider = new SimpleMessagesProvider(messages, fields)

export const registerValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(50)
      .alpha({ allowSpaces: true, allowDashes: true, allowUnderscores: false }),
    email: vine
      .string()
      .trim()
      .minLength(5)
      .maxLength(255)
      .email()
      .use(unique({ table: 'users', column: 'email', label: 'Alamat email' })),
    password: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(16)
      .regex(/^(?=.*\d)[A-Za-z\d]{8,16}$/)
      .confirmed(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().minLength(5).maxLength(255).email(),
    password: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(16)
      .regex(/^(?=.*\d)[A-Za-z\d]{8,16}$/),
    remember_me: vine.boolean().optional(),
  })
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().trim().minLength(5).maxLength(255).email(),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    password: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(16)
      .regex(/^(?=.*\d)[A-Za-z\d]{8,16}$/)
      .confirmed(),
  })
)
