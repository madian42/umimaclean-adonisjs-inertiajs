import UserLayout from '@/components/layouts/user-layout'
import { Link, useRouter } from '@tuyau/inertia/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, ChevronRight, MapPin, Truck, X } from 'lucide-react'
import { cn, getStatusDisplay } from '@/lib/utils'
import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Order } from '@/types'
import PhotoThumb from '@/components/mollecules/photo-thumb'
import ServiceItemCard from '@/components/organisms/service-item'
import OrderStatuses from '#enums/order_status_enum'

export default function OrderDetailPage({ order }: { order: Order }) {
  const router = useRouter()

  const statusDisplay = getStatusDisplay(order)
  const [openDetail, setOpenDetail] = useState<string>('')

  async function handleDownPayment() {
    router.visit(
      { route: 'transactions.dp.handle', params: { id: order.number } },
      {
        method: 'post',
        onSuccess: () => {
          toast.success('Pembayaran DP berhasil dibuat. Silakan lanjutkan pembayaran.')
        },
        onError: (errors) => {
          if (errors?.general_errors) {
            toast.error(errors.general_errors)
          }

          if (errors?.limiter_errors) {
            toast.error(errors.limiter_errors)
          }
        },
      }
    )
  }

  async function handleFullPayment() {
    router.visit(
      { route: 'transactions.full.handle', params: { id: order.number } },
      {
        method: 'post',
        onSuccess: () => {
          toast.success('Pembayaran penuh berhasil dibuat. Silakan lanjutkan pembayaran.')
        },
        onError: (errors) => {
          if (errors?.general_errors) {
            toast.error(errors.general_errors)
          }

          if (errors?.limiter_errors) {
            toast.error(errors.limiter_errors)
          }
        },
      }
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-4 py-4 border-b">
          <div className="flex items-center gap-3">
            <Link route="orders.index">
              <Button variant="ghost" size="sm" className="p-2 cursor-pointer h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Detail Pesanan</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium mb-2">Pesanan Tidak Ditemukan</h3>
            <p className="text-gray-500 text-sm mb-4">Pesanan dengan ID tidak ditemukan</p>
            <Link route="orders.index">
              <Button variant="outline">Kembali ke Daftar Pesanan</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <UserLayout>
      <div className="min-h-screen md:min-h-[calc(100vh-39px)] bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white px-4 py-4 border-b">
          <div className="flex items-center gap-3">
            <Link route="orders.index">
              <Button variant="ghost" size="sm" className="p-2 cursor-pointer h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Detail Pesanan</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 pb-20 space-y-4">
          <Card className="gap-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Status Pesanan</CardTitle>
              <Link route='orders.status' params={{ id: order.number }}>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div>
                <div className="flex space-x-2 items-center">
                  <Truck />
                  <Badge variant="outline" className={cn('text-base', statusDisplay.className)}>
                    {statusDisplay.text}
                  </Badge>
                </div>
                <p className="text-sm ml-10 text-gray-700">
                  {format(order.statuses[0].updatedAt, 'd MMM yyyy H:mm', {
                    locale: id,
                  })}
                </p>

                {order.statuses[0].name === OrderStatuses.WAITING_DEPOSIT && (
                  <Button onClick={handleDownPayment} className="ml-10 mt-3 cursor-pointer">
                    Pembayaran DP
                  </Button>
                )}

                {order.statuses[0].name === OrderStatuses.WAITING_PAYMENT && (
                  <Button onClick={handleFullPayment} className="ml-10 mt-3 cursor-pointer">
                    Pembayaran Penuh
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {order.service && <ServiceItemCard />}

          {/* Informasi Pelanggan */}
          <Card className="gap-2">
            <CardHeader className="flex items-center">
              <MapPin className="w-4 h-4" />
              <CardTitle>Alamat Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {order.address.name} <span className="font-normal">({order.address.phone})</span>
              </p>
              <p className="text-sm">{order.address.street}</p>
            </CardContent>
          </Card>

          {order.photos && order.photos.length > 0 && (
            <Card className="gap-2">
              <CardHeader>
                <CardTitle>Bukti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {order.photos.slice(0, 3).map((photo, index) => (
                    <PhotoThumb
                      key={index} // Unique key for each PhotoThumb component
                      src={`/storage/${photo.path}`}
                      label={photo.stage}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Jadwal & Waktu */}
          <Card className="gap-2 pt-6 pb-0">
            <CardHeader className="flex justify-between">
              <CardTitle>No. Pesanan</CardTitle>
              <p className="font-medium">{order.number}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nota Pesanan</span>
                <span className="text-sm">
                  {format(order.createdAt, 'd MMM yyyy H:mm', { locale: id })}
                </span>
              </div>
              <Accordion value={openDetail} onValueChange={setOpenDetail} type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionContent className="space-y-3">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Waktu Pembuatan</span>
                      <span className="text-sm">
                        {format(order.createdAt, 'd MMM yyyy H:mm', { locale: id })}
                      </span>
                    </div>
                    {order.photos && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Waktu Penjemputan</span>
                          <span className="text-sm">
                            {format(order.date, 'd MMM yyyy H:mm', { locale: id })}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Waktu Pengecekan</span>
                          <span className="text-sm">
                            {format(order.date, 'd MMM yyyy H:mm', { locale: id })}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Waktu Pengantaran</span>
                          <span className="text-sm">
                            {format(order.date, 'd MMM yyyy H:mm', { locale: id })}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Waktu Pesanan Selesai</span>
                          <span className="text-sm">
                            {format(order.date, 'd MMM yyyy H:mm', { locale: id })}
                          </span>
                        </div>
                      </>
                    )}
                  </AccordionContent>
                  <AccordionTrigger className="flex cursor-pointer justify-center pt-2">
                    {openDetail === 'item-1' ? 'Lihat Lebih Sedikit' : 'Lihat Semua'}
                  </AccordionTrigger>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {order.statuses[0].name === OrderStatuses.WAITING_DEPOSIT && (
            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full cursor-pointer border-red-200 text-red-600 hover:bg-red-50 h-11 bg-transparent"
              >
                <X className="w-4 h-4" />
                Batalkan Pesanan
              </Button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
