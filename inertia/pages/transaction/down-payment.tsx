import { transmit } from '@/app/transmit'
import QRISPaymentCard from '@/components/qris-payment'
import { formatIDR } from '@/lib/utils'
import { Transaction } from '@/types'
import { useRouter } from '@tuyau/inertia/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function DownPaymentPage({ transaction }: { transaction: Transaction }) {
  const router = useRouter()

  useEffect(() => {
    if (!transaction?.order?.number) return

    // Create subscription
    const channel = `payments/${transaction.order.number}/dp`
    const sub = transmit.subscription(channel)

    let stop: (() => void) | undefined
    ;(async () => {
      try {
        await sub.create()

        stop = sub.onMessage(() => {
          router.visit(
            {
              route: 'orders.show',
              params: { id: transaction.order.number },
            },
            {
              onSuccess: () => {
                toast.success('Pembayaran DP berhasil diterima!')
              },
            }
          )
        })
      } catch (err) {
        console.error('Transmit subscribe failed', err)
      }
    })()

    return () => {
      if (stop) stop()
      sub.delete().catch(() => {})
    }
  }, [transaction.order.number])

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-sm mx-auto pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pembayaran Uang Muka</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Silakan lakukan pembayaran uang muka melalui QRIS
          </p>
        </div>

        {/* Payment Card */}
        <QRISPaymentCard
          amount={transaction.amount}
          qrCode={transaction.midtransId}
          orderNumber={transaction.order.number}
          dueDate={transaction.expiredAt}
          qrDownload={transaction.midtransQrCode}
          transactionId={transaction.midtransId}
        />

        {/* Order Details */}
        <div className="mt-6 bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-4">Detail Pesanan</h3>

          <div className="border-t border-border pt-3 mb-4">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Uang Muka</span>
              <span className="font-bold text-primary">
                {formatIDR(Number(transaction.amount))}
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded p-3 mb-4">
            <p className="text-xs text-muted-foreground">
              Uang muka ini merupakan pembayaran awal untuk layanan pengiriman dan akan dipotong
              dari total pembayaran penuh. Biaya ini berfungsi sebagai jaminan pesanan untuk
              mencegah pembatalan sembarangan.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>No. Invoice:</span>
              <span className="font-mono text-foreground">{transaction.order.number}</span>
            </div>
            <div className="flex justify-between">
              <span>Batas Bayar:</span>
              <span className="font-mono text-foreground">
                {format(transaction.expiredAt, 'HH:mm dd/MM/yyyy', { locale: id })}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3">Cara Pembayaran</h3>
          <ol className="space-y-2 text-sm text-foreground">
            <li>1. Buka aplikasi perbankan atau e-wallet Anda</li>
            <li>2. Pilih opsi pembayaran via QRIS atau scan QR Code</li>
            <li>3. Arahkan kamera ke QR Code di atas</li>
            <li>4. Verifikasi detail pembayaran dan konfirmasi</li>
            <li>5. Pembayaran akan langsung diproses</li>
          </ol>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Pembayaran Anda dilindungi dan aman</p>
        </div>
      </div>
    </main>
  )
}
