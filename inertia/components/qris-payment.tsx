import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useRouter } from '@tuyau/inertia/react'
import { differenceInMilliseconds, format, intervalToDuration } from 'date-fns'
import { formatIDR } from '@/lib/utils'
import { id } from 'date-fns/locale'
import { Button } from './ui/button'

interface QRISPaymentCardProps {
  amount: number
  qrCode: string
  orderNumber: string
  dueDate: string
  qrDownload: string
  transactionId: string
}

export default function QRISPaymentCard({
  amount,
  qrCode,
  orderNumber,
  dueDate,
  qrDownload,
  transactionId,
}: QRISPaymentCardProps) {
  const router = useRouter()

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft())
  const [isExpired, setIsExpired] = useState<boolean>(false)

  function calculateTimeLeft() {
    const currentTime = new Date()
    const timeRemaining = differenceInMilliseconds(dueDate, currentTime)

    // If expired, return zero time
    if (timeRemaining <= 0) {
      setIsExpired(true)
      return { minutes: 0, seconds: 0 }
    }

    // Get the remaining time as a duration object
    const duration = intervalToDuration({ start: currentTime, end: dueDate })

    return {
      minutes: duration.minutes || 0,
      seconds: duration.seconds || 0,
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval) // Cleanup interval on unmount
  }, [dueDate]) // dependency on expiryDate

  useEffect(() => {
    if (isExpired) {
      // When expired, redirect to booking detail page
      router.visit({ route: 'orders.show', params: { id: orderNumber } })
    }
  }, [isExpired, orderNumber, router])

  return (
    <div className="bg-card border-2 border-foreground rounded-lg p-6 space-y-6">
      {/* QRIS Logo / Label */}
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">
          UmimaClean
        </span>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg border border-foreground/20">
          <img
            src={`https://api.sandbox.midtrans.com/v2/qris/${qrCode}/qr-code`}
            alt="QRIS QR Code"
            width={300}
            height={300}
          />
        </div>
      </div>

      <div className="mt-4">
        <a
          href={`/download-qris/${qrDownload}/${transactionId}`}
          className="w-full block"
          rel="noopener"
        >
          <Button className="w-full cursor-pointer">Unduh QRIS</Button>
        </a>
      </div>

      {/* Amount Section */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Jumlah Pembayaran</p>
        <p className="text-3xl font-bold text-foreground">{formatIDR(Number(amount))}</p>

        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            isExpired
              ? 'bg-destructive/20 text-destructive border border-destructive'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {isExpired ? 'Kadaluarsa' : `${timeLeft.minutes}:${timeLeft.seconds} tersisa`}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border"></div>

      {/* Quick Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">No. Pesanan</span>
          <span className="font-mono font-semibold text-foreground">{orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Jatuh Tempo</span>
          <span className="font-mono font-semibold text-foreground">
            {format(dueDate, 'HH:mm dd/MM/yyyy', { locale: id })}
          </span>
        </div>
      </div>
    </div>
  )
}
