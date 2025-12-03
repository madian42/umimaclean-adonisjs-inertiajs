import QRISPaymentCard from '@/components/qris-payment'
import { Button } from '@/components/ui/button'
import { Transaction } from '@/types'

export default function FullPaymentPage({ transaction }: { transaction: Transaction }) {
  const fullPaymentData = {
    items: [
      {
        name: 'Layanan Profesional',
        price: 'Rp 10.000.000',
        priceNumber: 10000000,
        addOns: [
          { name: 'Konsultasi Tambahan', price: 'Rp 2.000.000', priceNumber: 2000000 },
          { name: 'Support 24/7', price: 'Rp 3.000.000', priceNumber: 3000000 },
        ],
      },
      {
        name: 'Layanan Profesional',
        price: 'Rp 10.000.000',
        priceNumber: 10000000,
        addOns: [
          { name: 'Konsultasi Tambahan', price: 'Rp 2.000.000', priceNumber: 2000000 },
          { name: 'Support 24/7', price: 'Rp 3.000.000', priceNumber: 3000000 },
        ],
      },
    ],
  }

  const calculateItemSubtotal = (item: any) => {
    const itemPrice = item.priceNumber || 0
    const addOnsTotal =
      item.addOns?.reduce((sum: number, addon: any) => sum + (addon.priceNumber || 0), 0) || 0
    return itemPrice + addOnsTotal
  }

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-sm mx-auto pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pembayaran Penuh</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Silakan lakukan pembayaran penuh melalui QRIS
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

        <div className="mt-4">
          <a
            href={`/download-qris/${transaction.midtransQrCode}/${transaction.midtransId}`}
            className="w-full block"
            rel="noopener"
          >
            <Button className="w-full cursor-pointer">Unduh QRIS</Button>
          </a>
        </div>

        {/* Order Details */}
        <div className="mt-6 bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-4">Detail Pesanan</h3>

          <div className="bg-foreground/5 border border-foreground/10 rounded p-3 mb-4">
            <p className="text-xs text-foreground">
              <span className="font-semibold">Pengiriman Gratis:</span> Kami menyediakan layanan
              pickup gratis. Uang jaminan (down payment) sebesar Rp 500.000 yang telah Anda bayarkan
              akan dipotong dari total pembayaran ini.
            </p>
          </div>

          <div className="space-y-3 mb-4">
            {fullPaymentData.items.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground">{item.name}</span>
                  <span className="font-semibold text-foreground">{item.price}</span>
                </div>

                {/* Show add-ons if available */}
                {item.addOns && item.addOns.length > 0 && (
                  <div className="ml-3 space-y-1 mb-2 border-l-2 border-border pl-3">
                    {item.addOns.map((addon: any, addonIdx: number) => (
                      <div
                        key={addonIdx}
                        className="flex justify-between text-xs text-muted-foreground"
                      >
                        <span>+ {addon.name}</span>
                        <span>{addon.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show subtotal if there are add-ons */}
                {item.addOns && item.addOns.length > 0 && (
                  <div className="flex justify-between text-sm mb-3 pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">
                      Rp {calculateItemSubtotal(item).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Down payment deduction line before total */}
          <div className="space-y-2 mb-4 border-t border-border pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">- Down Payment (Uang Jaminan)</span>
              <span className="font-semibold text-foreground">- Rp 500.000</span>
            </div>
          </div>

          <div className="border-t border-border pt-3 mb-4">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total Pembayaran</span>
              <span className="font-bold text-primary">{transaction.amount}</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded p-3 mb-4">
            <p className="text-xs text-muted-foreground">
              Ini adalah pembayaran penuh untuk seluruh layanan. Terima kasih telah menjadi
              pelanggan kami.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>No. Invoice:</span>
              <span className="font-mono text-foreground">{transaction.order.number}</span>
            </div>
            <div className="flex justify-between">
              <span>Batas Bayar:</span>
              <span className="font-mono text-foreground">{transaction.expiredAt}</span>
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
