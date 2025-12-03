import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class DownloadTransactionController {
  async handle({ params, response, session }: HttpContext) {
    try {
      // Midtrans public QR endpoint (v2) - image is directly accessible, no auth needed
      const qrUrl = `https://merchants-app.sbx.midtrans.com/v4/qris/gopay/${params.qr}/qr-code`

      const res = await fetch(qrUrl)

      // Non-200 status
      if (!res.ok) {
        logger.warn(`Failed fetching QRIS (${res.status}) for ${params.id}`)
        session.flash('general_errors', 'Gagal mengambil QR dari Midtrans')
        return response.redirect().back()
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.startsWith('image')) {
        logger.warn(`Unexpected content-type "${contentType}" for QRIS ${params.id}`)
        session.flash('general_errors', 'Format QR tidak valid')
        return response.redirect().back()
      }

      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      response.header('Content-Type', 'image/png')
      response.header('Content-Disposition', `attachment; filename="qris-${params.id}.png"`)
      response.header('Cache-Control', 'no-store')
      return response.send(buffer)
    } catch (error) {
      logger.error('Error downloading QRIS:', error)
      session.flash('general_errors', 'Gagal mengunduh QRIS')
      return response.redirect().back()
    }
  }
}
