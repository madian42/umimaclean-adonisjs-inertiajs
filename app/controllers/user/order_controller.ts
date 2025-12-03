import OrderStatuses from '#enums/order_status_enum'
import Address from '#models/address'
import Order from '#models/order'
import OrderStatus from '#models/order_status'
import { orderValidator } from '#validators/order_validator'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

/**
 * Handles ONLINE order creation and management for customers.
 * All orders are pickup and delivery service type.
 * Orders start with WAITING_DEPOSIT status and are identified by unique number.
 */
export default class OrderController {
  /**
   * Show order creation form with user's address for delivery location.
   */
  async create({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    // Fetch user's addresses
    const address = await Address.query().where('user_id', user.id).first()

    return inertia.render('user/order/create', {
      addressId: address?.id,
    })
  }

  /**
   * Create new online order with WAITING_DEPOSIT status.
   * Validates address ownership and uses transaction for atomicity.
   */
  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(orderValidator)

    // Validate that address exists and belongs to user
    const address = await Address.query()
      .where('id', payload.addressId)
      .andWhere('user_id', user.id)
      .first()

    if (!address) {
      session.flash('general_errors', 'Alamat tidak ditemukan atau bukan milik Anda')
      return response.redirect().back()
    }

    // Create online order with transaction
    const trx = await db.transaction()
    try {
      // Create the order
      // Order belongs to authenticated user, uses their selected address
      const order = await Order.create(
        {
          addressId: payload.addressId, // User's delivery address
          type: 'online', // ALWAYS online for user-created orders
          date: payload.date,
          userId: user.id, // Order belongs to authenticated user
        },
        { client: trx }
      )

      // Create initial status (all orders start with WAITING_DEPOSIT)
      await OrderStatus.create(
        {
          orderId: order.id,
          name: OrderStatuses.WAITING_DEPOSIT,
        },
        { client: trx }
      )

      await trx.commit()

      // Redirect to order details page
      return response.redirect().toRoute('orders.show', {
        id: order.number,
      })
    } catch (error) {
      await trx.rollback()

      logger.error(`Error creating online order: ${error.message}`)
      session.flash('general_errors', 'Gagal membuat pesanan')
      return response.redirect().back()
    }
  }

  /**
   * List user's orders with search, status filtering, and pagination.
   * Supports searching by order number and address details.
   * Status filter: 'active' (in progress) or 'completed' (finished/cancelled).
   */
  async index({ request, auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get query parameters
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const status = request.input('status', 'active') // 'completed', 'active'

    // Build the base query - only user's online orders
    const query = Order.query()
      .preload('address') // User's delivery address
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc') // Latest status first
      })
      .where('user_id', user.id) // Only user's orders
      .where('type', 'online') // Only online orders

    // Apply search filter across multiple fields
    if (search) {
      query.where((builder) => {
        builder
          .where('number', 'like', `%${search}%`) // Search by order number
          .orWhereHas('address', (addressBuilder) => {
            // Search by address details
            addressBuilder
              .where('name', 'like', `%${search}%`)
              .orWhere('phone', 'like', `%${search}%`)
              .orWhere('street', 'like', `%${search}%`)
          })
      })
    }

    // Apply status filter
    if (status === 'completed') {
      // Show only completed or cancelled orders
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder
          .where('name', OrderStatuses.COMPLETED)
          .orWhere('name', OrderStatuses.CANCELLED)
      })
    } else if (status === 'active') {
      // Show orders that are in progress (not completed or cancelled)
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder
          .whereNot('name', OrderStatuses.COMPLETED)
          .andWhereNot('name', OrderStatuses.CANCELLED)
      })
    }

    // Execute query with pagination
    const orders = await query.orderBy('created_at', 'desc').paginate(page, 10)

    return inertia.render('user/order/index', {
      orders: orders.serialize(),
      filters: {
        search,
        status,
        page,
      },
    })
  }

  /**
   * Show full order details including address, status history, photos, and transactions.
   * Only accessible by order owner.
   */
  async show({ params, inertia, auth, session, response }: HttpContext) {
    const orderNumber = params.id
    const user = auth.getUserOrFail()

    // Fetch order with all related data
    const order = await Order.query()
      .preload('address') // User's delivery address
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc') // Latest status first
      })
      .preload('photos') // Photos taken at pickup/check/delivery
      .preload('transactions') // Payment transactions
      .where('number', orderNumber)
      .andWhere('user_id', user.id) // Security: ensure order belongs to user
      .andWhere('type', 'online') // Security: only online orders
      .first()

    if (!order) {
      session.flash('general_errors', 'Pesanan tidak ditemukan.')
      return response.redirect().toRoute('orders.index')
    }

    return inertia.render('user/order/show', {
      order,
    })
  }

  /**
   * Show chronological history of order status changes.
   * Only accessible by order owner.
   */
  async status({ params, inertia, auth, session, response }: HttpContext) {
    const orderNumber = params.id
    const user = auth.getUserOrFail()

    // Fetch order to verify ownership
    const order = await Order.query()
      .where('number', orderNumber)
      .andWhere('user_id', user.id) // Security: ensure order belongs to user
      .andWhere('type', 'online') // Security: only online orders
      .first()

    if (!order) {
      session.flash('general_errors', 'Pesanan tidak ditemukan.')
      return response.redirect().toRoute('orders.index')
    }

    // Fetch all statuses for this order
    const statuses = await OrderStatus.query()
      .where('order_id', order.id)
      .orderBy('updated_at', 'desc') // Latest status first

    return inertia.render('user/order/status', {
      statuses,
      order,
    })
  }
}
