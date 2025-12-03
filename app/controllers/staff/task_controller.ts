import OrderStatuses from '#enums/order_status_enum'
import Order from '#models/order'
import { findStatusCodesByDisplaySearch } from '#utils/status_search'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * TaskController (Staff)
 *
 * Handles staff dashboard and task management.
 * Shows orders that need staff attention at different stages.
 *
 * Business Logic:
 * - Regular users are redirected to order creation page
 * - Staff can view and filter orders by processing stage
 * - Supports search across order number, customer details, address
 * - Filters: all (active), pickup, inspection, delivery
 * - Completed/cancelled orders are excluded from "all" filter
 *
 * Task Stages:
 * - PICKUP: Online orders waiting for shoe pickup from customer
 * - INSPECTION: Orders waiting for shoe inspection and assessment
 * - DELIVERY: Orders ready for delivery (online) or customer pickup (offline)
 */
export default class TaskController {
  /**
   * Display paginated list of orders for staff dashboard
   *
   * Business Logic:
   * - Non-staff users are redirected to order creation
   * - Supports filtering by search term and status (all/pickup/inspection/delivery)
   * - Search covers: order number, customer name, phone, address, status
   * - "all" filter: all orders except completed/cancelled
   * - "pickup" filter: orders with PICKUP_SCHEDULED status (online only)
   * - "inspection" filter: orders with INSPECTION status (all orders)
   * - "delivery" filter: orders with DELIVERY status (all orders)
   *
   * Query Parameters:
   * - search: Search term (optional)
   * - status: Filter by stage - 'all', 'pickup', 'inspection', 'delivery' (default: 'all')
   * - page: Page number (default: 1)
   *
   * @returns Inertia page with paginated orders and counts for each filter
   */
  async index({ inertia, request }: HttpContext) {
    // Pagination and filter parameters
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const status = request.input('status', 'all') // 'all', 'pickup', 'inspection', 'delivery'

    // Convert display-friendly status names to internal status codes
    const statusCodesFromDisplay = findStatusCodesByDisplaySearch(search)

    /**
     * Base query builder function
     * Creates a reusable query with search filters applied
     *
     * Returns fresh query instance each time to avoid query builder conflicts
     */
    const baseQuery = () => {
      const query = Order.query()
        .preload('address') // All orders have addresses now
        .preload('statuses', (statusQuery) => {
          statusQuery.orderBy('updated_at', 'desc') // Latest status first
        })

      // Apply search filter across multiple fields
      if (search) {
        query.where((builder) => {
          builder
            .where('number', 'like', `%${search}%`) // Search by order number
            .orWhereHas('address', (addressBuilder) => {
              // Search by address details (customer name, phone, street)
              addressBuilder
                .where('name', 'like', `%${search}%`) // Customer name
                .orWhere('phone', 'like', `%${search}%`) // Phone number
                .orWhere('street', 'like', `%${search}%`) // Street address
            })
            .orWhereHas('statuses', (statusBuilder) => {
              statusBuilder.where('name', 'like', `%${search}%`) // Status name
            })

          // Include internal status codes if search matches display names
          if (statusCodesFromDisplay.length > 0) {
            builder.orWhereHas('statuses', (statusBuilder) => {
              statusBuilder.whereIn('name', statusCodesFromDisplay)
            })
          }
        })
      }

      return query
    }

    /**
     * Get counts for each filter tab
     * Used to display badge numbers in UI
     */

    // Count all active orders (excluding completed/cancelled)
    const allQuery = baseQuery()
    allQuery.whereHas('statuses', (statusBuilder) => {
      statusBuilder
        .whereNot('name', OrderStatuses.COMPLETED)
        .andWhereNot('name', OrderStatuses.CANCELLED)
    })
    const allCount = await allQuery.count('* as total')

    // Count orders at PICKUP_SCHEDULED stage
    const pickupQuery = baseQuery()
    pickupQuery.whereHas('statuses', (statusBuilder) => {
      statusBuilder.where('name', OrderStatuses.PICKUP_SCHEDULED)
    })
    const pickupCount = await pickupQuery.count('* as total')

    // Count orders at INSPECTION stage
    const inspectionQuery = baseQuery()
    inspectionQuery.whereHas('statuses', (statusBuilder) => {
      statusBuilder.where('name', OrderStatuses.INSPECTION)
    })
    const inspectionCount = await inspectionQuery.count('* as total')

    // Count orders at DELIVERY stage
    const deliveryQuery = baseQuery()
    deliveryQuery.whereHas('statuses', (statusBuilder) => {
      statusBuilder.where('name', OrderStatuses.DELIVERY)
    })
    const deliveryCount = await deliveryQuery.count('* as total')

    /**
     * Main query based on selected status filter
     *
     * Filter Options:
     * - 'all': Active orders (default, excludes completed/cancelled)
     * - 'pickup': Orders at PICKUP_SCHEDULED stage
     * - 'inspection': Orders at INSPECTION stage
     * - 'delivery': Orders at DELIVERY stage
     */
    const query = baseQuery()

    if (status === 'pickup') {
      // Show only orders waiting for pickup (online orders)
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder.where('name', OrderStatuses.PICKUP_SCHEDULED)
      })
    } else if (status === 'inspection') {
      // Show only orders waiting for inspection (all orders)
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder.where('name', OrderStatuses.INSPECTION)
      })
    } else if (status === 'delivery') {
      // Show only orders ready for delivery/pickup (all orders)
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder.where('name', OrderStatuses.DELIVERY)
      })
    } else {
      // 'all' filter: exclude completed and cancelled orders
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder
          .whereNot('name', OrderStatuses.COMPLETED)
          .andWhereNot('name', OrderStatuses.CANCELLED)
      })
    }

    // Execute main query with pagination (oldest first for task queue)
    const orders = await query.orderBy('created_at', 'asc').paginate(page, 10)

    return inertia.render('staff/task/index', {
      orders,
      filters: {
        search,
        status,
        page,
      },
      counts: {
        all: Number(allCount[0].$extras.total),
        pickup: Number(pickupCount[0].$extras.total),
        inspection: Number(inspectionCount[0].$extras.total),
        delivery: Number(deliveryCount[0].$extras.total),
      },
    })
  }
}
