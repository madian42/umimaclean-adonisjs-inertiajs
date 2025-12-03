import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = {
  'required': '{{ field }} harus diisi',
  'minLength': '{{ field }} harus memiliki minimal {{ min }} karakter',
  'maxLength': '{{ field }} harus memiliki maksimal {{ max }} karakter',
  'string': '{{ field }} harus berupa teks',
  'alpha': '{{ field }} hanya boleh berisi huruf, spasi, dan tanda hubung',
  'confirmed': '{{ field }} tidak cocok',
  'password.regex':
    '{{ field }} harus memiliki minimal 8 karakter, termasuk huruf besar, huruf kecil, dan angka',
  'email': '{{ field }} harus berupa alamat email yang valid',
  'sameAs': '{{ field }} harus sama dengan kata sandi',
}

const fields = {
  name: 'Nama',
  email: 'Alamat email',
  password: 'Kata sandi',
  password_confirmation: 'Konfirmasi kata sandi',
  current_password: 'Kata sandi saat ini',
}

vine.messagesProvider = new SimpleMessagesProvider(messages, fields)

export const updateNameValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(50)
      .alpha({ allowSpaces: true, allowDashes: true, allowUnderscores: false }),
  })
)

export const updatePasswordValidator = vine.compile(
  vine.object({
    current_password: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(16)
      .regex(/^[a-zA-Z0-9]+$/),
    password: vine
      .string()
      .trim()
      .minLength(8)
      .maxLength(16)
      .regex(/^[a-zA-Z0-9]+$/)
      .confirmed(),
  })
)
