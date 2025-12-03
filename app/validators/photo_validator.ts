import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { shoe } from './order_validator.js'

const messages = {
  'image.size': '{{ field }} harus berukuran maksimal {{ options.size }}',
  'image.extnames':
    '{{ field }} harus berupa salah satu dari ekstensi yang diizinkan: {{ options.extnames }}',
}

const fields = {
  image: 'Foto',
}

vine.messagesProvider = new SimpleMessagesProvider(messages, fields)

export const uploadPhotoValidator = vine.compile(
  vine.object({
    image: vine.file({
      size: '5mb',
      extnames: ['png', 'jpg', 'jpeg'],
    }),
  })
)

export const inspectionValidatorWithPhoto = vine.compile(
  vine.object({
    totalShoes: vine.number(),
    shoes: vine.array(shoe),
    image: vine.file({
      size: '5mb',
      extnames: ['png', 'jpg', 'jpeg'],
    }),
  })
)
