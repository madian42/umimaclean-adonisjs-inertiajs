import Service from '#models/service'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class ServiceSeeder extends BaseSeeder {
  async run() {
    // Ids can be UUID auto-generated; if you want fixed IDs, you must insert with a provided uuid.
    // Here we let DB generate ids; we identify services by name.
    type Services = {
      name: string
      description: string
      price: number
      type: 'primary' | 'additional' | 'start_from'
    }

    const services: Services[] = [
      {
        name: 'Premium For Suede',
        description:
          'Perawatan khusus untuk sepatu suede agar kembali memiliki dua side gelap dan terang serta lembut kembali.',
        price: 120000,
        type: 'start_from',
      },
      {
        name: 'Mild',
        description: 'Pencucian bagian luar dan dalam untuk menjaga sepatu tetap bersih.',
        price: 60000,
        type: 'primary',
      },
      {
        name: 'Medium',
        description:
          'Pencucian bagian luar dan dalam pada sepatu yang terdapat noda cenderung ringan.',
        price: 65000,
        type: 'primary',
      },
      {
        name: 'Hard',
        description:
          'Pencucian bagian luar dan dalam pada sepatu yang terdapat noda berat atau cenderung berat.',
        price: 70000,
        type: 'primary',
      },
      {
        name: 'Kids Shoes',
        description: 'Pencucian bagian luar dan dalam untuk menjaga sepatu anak tetap bersih.',
        price: 40000,
        type: 'start_from',
      },
      {
        name: 'Just For Her',
        description:
          'Pencucian bagian luar dan dalam untuk menjaga sepatu wanita tetap bersih. (Flat shoes, heels, wedges, dan flip flops)',
        price: 45000,
        type: 'primary',
      },
      {
        name: 'Unyellowing',
        description: 'Pencucian untuk menghilangkan warna kuning.',
        price: 30000,
        type: 'start_from',
      },
      {
        name: 'White Shoes / Mummy',
        description: 'Tambahan jasa perawatan khusus sepatu putih',
        price: 10000,
        type: 'additional',
      },
      {
        name: 'Nubuck Suede',
        description: 'Perawatan khusus sepatu nubuck suede',
        price: 10000,
        type: 'additional',
      },
      {
        name: 'One Day Service',
        description: 'Pencucian sepatu dalam satu hari',
        price: 10000,
        type: 'additional',
      },
    ]

    for (const service of services) {
      const exists = await Service.query().where('name', service.name).first()
      if (!exists) {
        await Service.create(service)
      }
    }
  }
}
