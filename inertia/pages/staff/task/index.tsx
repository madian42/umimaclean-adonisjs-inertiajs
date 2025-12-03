import { useState } from 'react'
import { Search } from 'lucide-react'
import { router } from '@inertiajs/react'
import { Order, Filters, PaginatedData } from '@/types'
import { tuyau } from '@/app/tuyau'
import StaffLayout from '@/components/layouts/staff-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Pagination from '@/components/organisms/pagination'
import StaffOrderTabs from '@/components/organisms/staff-order-tabs'

export default function StaffDashboard({
  orders,
  filters,
  counts,
}: {
  orders: PaginatedData<Order>
  filters: Filters
  counts: {
    all: number
    pickup: number
    inspection: number
    delivery: number
  }
}) {
  const [searchTerm, setSearchTerm] = useState<string>(filters.search)
  const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'all')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  function handleSearch(search: string) {
    setIsLoading(true)
    const url = tuyau.$url('staff.tasks', {
      query: { search, status: statusFilter, page: 1 },
    })
    router.get(url, {}, { onFinish: () => setIsLoading(false) })
  }

  async function handleStatusFilter(status: string) {
    setIsLoading(true)
    setStatusFilter(status)
    const url = tuyau.$url('staff.tasks', {
      query: { search: searchTerm, status, page: 1 },
    })
    router.get(url, {}, { onFinish: () => setIsLoading(false) })
  }

  function handlePageChange(page: number) {
    setIsLoading(true)
    const url = tuyau.$url('staff.tasks', {
      query: { search: searchTerm, status: statusFilter, page },
    })
    router.get(url, {}, { onFinish: () => setIsLoading(false) })
  }

  const stageFilters = [
    { id: 'all', label: 'Semua', count: counts.all },
    { id: 'pickup', label: 'Pickup', count: counts.pickup },
    { id: 'inspection', label: 'Inspection', count: counts.inspection },
    { id: 'delivery', label: 'Delivery', count: counts.delivery },
  ]

  return (
    <StaffLayout>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
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

            {/* Stage Filter Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-8">
              {stageFilters.map((filter) => (
                <Button
                  key={filter.id}
                  onClick={() => handleStatusFilter(filter.id)}
                  disabled={isLoading}
                  className={
                    statusFilter === filter.id
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-white text-black border border-black hover:bg-gray-100'
                  }
                >
                  {filter.label}
                  {filter.id !== 'all' && <span className="ml-1">({filter.count})</span>}
                </Button>
              ))}
            </div>

            {/* Content based on selected stage */}
            <StaffOrderTabs
              isLoading={isLoading}
              isSearch={searchTerm.length > 0}
              items={orders.data}
            />

            {/* Pagination */}
            {orders.meta.lastPage > 1 && (
              <div className="pb-10">
                <Pagination
                  orders={orders}
                  handlePageChange={handlePageChange}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  )
}
