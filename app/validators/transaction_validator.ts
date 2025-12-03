import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = {
  required: '{{ field }} harus diisi',
  number: '{{ field }} harus berupa angka',
  positive: '{{ field }} harus berupa angka positif',
}

const fields = {
  addressId: 'ID Alamat',
  date: 'Tanggal',
  stage: 'Tahap',
}

vine.messagesProvider = new SimpleMessagesProvider(messages, fields)

export const transactionValidator = vine.compile(
  vine.object({
    amount: vine.number().positive(),
  })
)
