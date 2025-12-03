import { Button } from '@/components/ui/button'
import { Order, PaginatedData } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
  orders,
  handlePageChange,
  isLoading,
}: {
  orders: PaginatedData<Order>
  handlePageChange: (page: number) => void
  isLoading: boolean
}) {
  return (
    <div className="mt-6 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(orders.meta.currentPage - 1)}
          disabled={orders.meta.currentPage === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, orders.meta.lastPage) }, (_, i) => {
            let pageNumber: number
            if (orders.meta.lastPage <= 5) {
              pageNumber = i + 1
            } else if (orders.meta.currentPage <= 3) {
              pageNumber = i + 1
            } else if (orders.meta.currentPage >= orders.meta.lastPage - 2) {
              pageNumber = orders.meta.lastPage - 4 + i
            } else {
              pageNumber = orders.meta.currentPage - 2 + i
            }

            return (
              <Button
                key={pageNumber}
                variant={orders.meta.currentPage === pageNumber ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(pageNumber)}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                {pageNumber}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(orders.meta.currentPage + 1)}
          disabled={orders.meta.currentPage === orders.meta.lastPage || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
