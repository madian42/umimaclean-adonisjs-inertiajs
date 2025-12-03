import { getStatusDisplay } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Camera, ClipboardList, Truck } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from '@tuyau/inertia/react'
import { usePage } from '@inertiajs/react'
import { toast } from 'sonner'
import { Order, SharedData } from '@/types'
import OrderStatuses from '#enums/order_status_enum'

export default function StaffOrderTabs({
  items,
  isLoading,
  isSearch,
}: {
  items: Order[]
  isLoading: boolean
  isSearch: boolean
}) {
  const { auth } = usePage<SharedData>().props
  const currentUserId = auth.user.id
  const router = useRouter()

  async function pickup(id: string) {
    router.visit(
      { route: 'staff.pickup', params: { id } },
      {
        method: 'get',
        onError: (errors) => {
          if (errors?.general_errors) {
            toast.error(errors.general_errors)
          }
        },
      }
    )
  }

  async function inspection(id: string) {
    router.visit(
      { route: 'staff.inspection', params: { id } },
      {
        method: 'get',
        onError: (errors) => {
          if (errors?.general_errors) {
            toast.error(errors.general_errors)
          }
        },
      }
    )
  }

  async function delivery(id: string) {
    router.visit(
      { route: 'staff.delivery', params: { id } },
      {
        method: 'get',
        onError: (errors) => {
          if (errors?.general_errors) {
            toast.error(errors.general_errors)
          }
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">Memuat data...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Tidak ada pesanan ditemukan</h3>
          <p className="text-muted-foreground">
            {isSearch
              ? 'Coba ubah kriteria pencarian atau filter Anda'
              : 'Belum ada pesanan yang dibuat'}
          </p>
        </div>
      ) : (
        items.map((order) => {
          const statusDisplay = getStatusDisplay(order)
          const orderStatus = order.statuses?.[0]?.name
          return (
            <Card key={order.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{order.number}</h3>
                  </div>
                  <Badge className={statusDisplay.className}>
                    <span className="ml-1">{statusDisplay.text}</span>
                  </Badge>
                </div>

                <div
                  className={`space-y-2 text-sm ${
                    (orderStatus === OrderStatuses.PICKUP_SCHEDULED && !order.adminId) ||
                    order.adminId === currentUserId ||
                    orderStatus === OrderStatuses.PICKUP_PROGRESS ||
                    orderStatus === OrderStatuses.DELIVERY ||
                    orderStatus === OrderStatuses.INSPECTION
                      ? 'mb-4'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {format(order.date, 'd MMM yyyy H:mm', { locale: id })}
                  </div>
                </div>

                <div className="flex gap-2">
                  {orderStatus === OrderStatuses.PICKUP_SCHEDULED && !order.adminId && (
                    <Button size="sm" className="flex-1" onClick={() => pickup(order.number)}>
                      <Truck className="w-4 h-4 mr-1" />
                      Ambil Pesanan
                    </Button>
                  )}

                  {order.adminId === currentUserId && (
                    <Button size="sm" variant="outline" className="flex-1 bg-red-100 text-red-700">
                      Lepas Pesanan
                    </Button>
                  )}

                  {orderStatus === OrderStatuses.INSPECTION && !order.adminId && (
                    <Button size="sm" className="flex-1" onClick={() => inspection(order.number)}>
                      <Camera className="w-4 h-4 mr-1" />
                      Pengecekan
                    </Button>
                  )}

                  {orderStatus === OrderStatuses.DELIVERY && !order.adminId && (
                    <Button size="sm" className="flex-1" onClick={() => delivery(order.number)}>
                      <Camera className="w-4 h-4 mr-1" />
                      Ambil Pengantaran
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
