import OrderStatuses from '#enums/order_status_enum'

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
