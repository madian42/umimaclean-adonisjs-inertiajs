import UserLayout from '@/components/layouts/user-layout'
import { Head, router } from '@inertiajs/react'
import { ClipboardList, Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Order, Filters, PaginatedData } from '@/types'
import OrderStatuses from '#enums/order_status_enum'
import { tuyau } from '@/app/tuyau'
import OrderTabs from '@/components/organisms/order-tabs'
import Pagination from '@/components/organisms/pagination'

export default function History({
  orders,
  filters,
}: {
  orders: PaginatedData<Order>
  filters: Filters
}) {
  const [searchTerm, setSearchTerm] = useState(filters.search)
  const [statusFilter, setStatusFilter] = useState(filters.status || 'active')
  const [isLoading, setIsLoading] = useState(false)

  const activeOrders = orders.data.filter((o) => {
    const name = o.statuses?.[0]?.name
    return name !== OrderStatuses.COMPLETED && name !== OrderStatuses.CANCELLED
  })
  const completedOrders = orders.data.filter((o) => {
    const name = o.statuses?.[0]?.name
    return name === OrderStatuses.COMPLETED || name === OrderStatuses.CANCELLED
  })

  function handleSearch(search: string) {
    setIsLoading(true)
    const url = tuyau.$url('orders.index', {
      query: { search, status: statusFilter, page: 1 },
    })
    router.get(url, {}, { onFinish: () => setIsLoading(false) })
  }

  async function handleStatusFilter(status: string) {
    setIsLoading(true)
    setStatusFilter(status)
    const url = tuyau.$url('orders.index', {
      query: { search: searchTerm, status, page: 1 },
    })
    router.get(url, {}, { onFinish: () => setIsLoading(false) })
  }

  function handlePageChange(page: number) {
    setIsLoading(true)
    const url = tuyau.$url('orders.index', {
      query: { search: searchTerm, status: statusFilter, page },
    })
    router.get(url, {}, { onFinish: () => setIsLoading(false) })
  }

  return (
    <UserLayout>
      <Head title="Riwayat Pesanan" />

      <div className="flex min-h-screen md:min-h-[calc(100vh-39px)] flex-col p-6">
        <div className="mb-6 text-center">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-2xl font-bold">Daftar Pesanan</h1>
          <p className="text-muted-foreground">Kelola semua pesanan Anda</p>
        </div>

        <div className="mb-6 space-y-4">
          {/* Search and Filter Section */}
          <div className="flex gap-4 flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nomor pesanan, nama, telepon, atau alamat..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchTerm)
                  }
                }}
              />
            </div>
            <Button
              className="cursor-pointer"
              onClick={() => handleSearch(searchTerm)}
              disabled={isLoading}
            >
              Cari
            </Button>
          </div>

          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={handleStatusFilter} className="w-full">
            <TabsList className="w-full h-10">
              <TabsTrigger value="active" className="text-xs">
                Sedang Berjalan
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">
                Selesai
              </TabsTrigger>
            </TabsList>

            {/* Tabs Content */}
            <TabsContent value={statusFilter} className="pb-10">
              <OrderTabs
                isLoading={isLoading}
                isSearch={searchTerm.length > 0}
                items={statusFilter === 'active' ? activeOrders : completedOrders}
              />

              {/* Pagination */}
              {orders.meta.lastPage > 1 && (
                <Pagination
                  orders={orders}
                  handlePageChange={handlePageChange}
                  isLoading={isLoading}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </UserLayout>
  )
}
