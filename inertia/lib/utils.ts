import OrderStatuses from '#enums/order_status_enum'
import { Order } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const OrderStatusDisplay: Record<OrderStatuses, { text: string; className: string }> = {
  [OrderStatuses.WAITING_DEPOSIT]: {
    text: 'Menunggu Deposit',
    className: 'bg-yellow-100 text-yellow-800',
  },
  [OrderStatuses.PICKUP_SCHEDULED]: {
    text: 'Penjemputan Dijadwalkan',
    className: 'bg-blue-100 text-blue-800',
  },
  [OrderStatuses.PICKUP_PROGRESS]: {
    text: 'Proses Penjemputan',
    className: 'bg-blue-100 text-blue-800',
  },
  [OrderStatuses.INSPECTION]: { text: 'Inspeksi', className: 'bg-purple-100 text-purple-800' },
  [OrderStatuses.WAITING_PAYMENT]: {
    text: 'Menunggu Pembayaran',
    className: 'bg-yellow-100 text-yellow-800',
  },
  [OrderStatuses.IN_PROCESS]: {
    text: 'Dalam Proses',
    className: 'bg-orange-100 text-orange-800',
  },
  [OrderStatuses.PROCESS_COMPLETED]: {
    text: 'Proses Selesai',
    className: 'bg-green-100 text-green-800',
  },
  [OrderStatuses.DELIVERY]: { text: 'Pengiriman', className: 'bg-blue-100 text-blue-800' },
  [OrderStatuses.COMPLETED]: { text: 'Selesai', className: 'bg-green-100 text-green-800' },
  [OrderStatuses.CANCELLED]: { text: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
}

export function findStatusCodesByDisplaySearch(term: string): OrderStatuses[] {
  if (!term) return []
  const lower = term.toLowerCase()
  return Object.entries(OrderStatusDisplay)
    .filter(([, v]) => v.text.toLowerCase().includes(lower))
    .map(([k]) => k as OrderStatuses)
}

export function getStatusDisplay(order: Order) {
  const latestStatus = Array.isArray(order.statuses) ? order.statuses[0] : null
  if (!latestStatus) return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' }

  return (
    OrderStatusDisplay[latestStatus.name as keyof typeof OrderStatusDisplay] || {
      text: latestStatus.name,
      className: 'bg-gray-100 text-gray-800',
    }
  )
}

export function formatIDR(price: number) {
  return price.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
}
