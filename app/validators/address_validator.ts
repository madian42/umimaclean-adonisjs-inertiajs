import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = {
  'required': '{{ field }} harus diisi',
  'minLength': '{{ field }} harus memiliki minimal {{ min }} karakter',
  'maxLength': '{{ field }} harus memiliki maksimal {{ max }} karakter',
  'string': '{{ field }} harus berupa teks',
  'number': '{{ field }} harus berupa angka',
  'alpha': '{{ field }} hanya boleh berisi huruf, spasi, dan tanda hubung',
  'phone.regex': '{{ field }} hanya boleh berisi angka',
  'min': '{{ field }} harus minimal {{ min }}',
  'max': '{{ field }} harus maksimal {{ max }}',
  'positive': '{{ field }} harus berupa angka positif',
  'optional': '{{ field }} bersifat opsional',
}

const fields = {
  name: 'Nama',
  phone: 'Nomor telepon',
  street: 'Nama jalan',
  latitude: 'Lintang',
  longitude: 'Bujur',
  radius: 'Radius',
  note: 'Catatan',
}

vine.messagesProvider = new SimpleMessagesProvider(messages, fields)

export const addressValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(50)
      .alpha({ allowSpaces: true, allowDashes: true, allowUnderscores: false }),
    phone: vine.string().trim().minLength(10).maxLength(13).regex(/^\d+$/),
    street: vine.string().trim().maxLength(255),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    radius: vine.number().positive().max(40000),
    note: vine.string().trim().maxLength(255).optional(),
  })
)
