import OrderStatuses from '#enums/order_status_enum'
import Order from '#models/order'
import { findStatusCodesByDisplaySearch } from '#utils/status_search'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Staff dashboard showing orders at different processing stages.
 * Filters: all (active), pickup, inspection, delivery.
 * Completed/cancelled orders excluded from "all" filter.
 */
export default class TaskController {
  /**
   * Display paginated list of orders with filtering.
   * Search: order number, customer name, phone, address, status.
   * Status filters: 'all', 'pickup', 'inspection', 'delivery'.
   */
  async index({ inertia, request }: HttpContext) {
    // Pagination and filter parameters
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const status = request.input('status', 'all') // 'all', 'pickup', 'inspection', 'delivery'

    // Convert display-friendly status names to internal status codes
    const statusCodesFromDisplay = findStatusCodesByDisplaySearch(search)

    // // Base query with search filters - returns fresh instance to avoid conflicts
    const query = Order.query()
      .preload('address')
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc') // Latest status first
      })

    // Apply search filter across multiple fields
    if (search) {
      query.where((builder) => {
        builder
          .where('number', 'like', `%${search}%`) // Search by booking number
          .orWhereHas('address', (addressBuilder) => {
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

    // Count distinct orders by their latest status
    const allCount = await Order.query()
      .whereIn('id', (subQuery) => {
        subQuery
          .from('order_statuses as os1')
          .select('os1.order_id')
          .whereNotIn('os1.name', [OrderStatuses.COMPLETED, OrderStatuses.CANCELLED])
          .whereRaw(
            'os1.updated_at = (SELECT MAX(os2.updated_at) FROM order_statuses os2 WHERE os2.order_id = os1.order_id)'
          )
      })
      .count('* as total')

    const pickupCount = await Order.query()
      .whereIn('id', (subQuery) => {
        subQuery
          .from('order_statuses as os1')
          .select('os1.order_id')
          .where('os1.name', OrderStatuses.PICKUP_SCHEDULED)
          .whereRaw(
            'os1.updated_at = (SELECT MAX(os2.updated_at) FROM order_statuses os2 WHERE os2.order_id = os1.order_id)'
          )
      })
      .count('* as total')

    const inspectionCount = await Order.query()
      .whereIn('id', (subQuery) => {
        subQuery
          .from('order_statuses as os1')
          .select('os1.order_id')
          .where('os1.name', OrderStatuses.INSPECTION)
          .whereRaw(
            'os1.updated_at = (SELECT MAX(os2.updated_at) FROM order_statuses os2 WHERE os2.order_id = os1.order_id)'
          )
      })
      .count('* as total')

    const deliveryCount = await Order.query()
      .whereIn('id', (subQuery) => {
        subQuery
          .from('order_statuses as os1')
          .select('os1.order_id')
          .where('os1.name', OrderStatuses.DELIVERY)
          .whereRaw(
            'os1.updated_at = (SELECT MAX(os2.updated_at) FROM order_statuses os2 WHERE os2.order_id = os1.order_id)'
          )
      })
      .count('* as total')

    if (status === 'pickup') {
      // Show only orders waiting for pickup (online orders) - based on latest status
      query.whereIn('id', (subQuery) => {
        subQuery
          .from('order_statuses as os1')
          .select('os1.order_id')
          .where('os1.name', OrderStatuses.PICKUP_SCHEDULED)
          .whereRaw(
            'os1.updated_at = (SELECT MAX(os2.updated_at) FROM order_statuses os2 WHERE os2.order_id = os1.order_id)'
          )
      })
    } else if (status === 'inspection') {
      // Show only orders waiting for inspection (all orders) - based on latest status
      query.whereIn('id', (subQuery) => {
        subQuery
          .from('order_statuses as os1')
          .select('os1.order_id')
          .where('os1.name', OrderStatuses.INSPECTION)
          .whereRaw(
            'os1.updated_at = (SELECT MAX(os2.updated_at) FROM order_statuses os2 WHERE os2.order_id = os1.order_id)'
          )
      })
    } else if (status === 'delivery') {
      // Show only orders ready for delivery/pickup (all orders) - based on latest status
      query.whereIn('id', (subQuery) => {
        subQuery
          .from('order_statuses as os1')
          .select('os1.order_id')
          .where('os1.name', OrderStatuses.DELIVERY)
          .whereRaw(
            'os1.updated_at = (SELECT MAX(os2.updated_at) FROM order_statuses os2 WHERE os2.order_id = os1.order_id)'
          )
      })
    } else {
      // 'all' filter: exclude completed and cancelled orders - based on latest status
      query.whereIn('id', (subQuery) => {
        subQuery
          .from('order_statuses as os1')
          .select('os1.order_id')
          .whereNotIn('os1.name', [OrderStatuses.COMPLETED, OrderStatuses.CANCELLED])
          .whereRaw(
            'os1.updated_at = (SELECT MAX(os2.updated_at) FROM order_statuses os2 WHERE os2.order_id = os1.order_id)'
          )
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
